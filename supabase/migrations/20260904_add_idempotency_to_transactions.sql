-- ==============================================================================
-- MIGRATION: 20260904_add_idempotency_to_transactions.sql
-- PERBAIKAN BUG #5: Idempotency Key & Pencegahan Double Transaction / Concurrency
-- ==============================================================================

-- 1. TAMBAH KOLOM client_transaction_id DENGAN UNIQUE CONSTRAINT
-- Lapisan pengaman terakhir di level database jika ada request duplikat
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS client_transaction_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_transactions_client_id 
ON transactions(client_transaction_id);

-- 2. UPDATE FUNGSI fn_checkout_transaction DENGAN DUKUNGAN IDEMPOTENCY KEY
CREATE OR REPLACE FUNCTION fn_checkout_transaction(
    p_invoice_no VARCHAR,
    p_cashier_id UUID,
    p_vehicle_id UUID,
    p_total_amount NUMERIC,
    p_discount_amount NUMERIC,
    p_cash_given NUMERIC,
    p_change_amount NUMERIC,
    p_payment_method VARCHAR,
    p_items JSONB,
    p_notes TEXT DEFAULT NULL,
    p_client_transaction_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_tx_id UUID;
    v_transaction_id UUID;
    v_item JSONB;
    v_product RECORD;
    v_item_qty INTEGER;
    v_item_price NUMERIC;
    v_item_subtotal NUMERIC;
    v_cashier_role VARCHAR;
BEGIN
    -- 0. IDEMPOTENCY CHECK: Jika client_transaction_id sudah pernah diproses sebelumnya,
    -- langsung kembalikan transaksi yang ada tanpa memotong stok ulang / membuat duplikat
    IF p_client_transaction_id IS NOT NULL THEN
        SELECT id INTO v_existing_tx_id
        FROM transactions
        WHERE client_transaction_id = p_client_transaction_id;

        IF FOUND THEN
            RETURN v_existing_tx_id;
        END IF;
    END IF;

    -- 1. Validasi Role: Mekanik TIDAK BOLEH memproses transaksi kasir
    SELECT role INTO v_cashier_role FROM users WHERE id = p_cashier_id;
    IF v_cashier_role = 'mekanik' THEN
        RAISE EXCEPTION 'Akses ditolak: User dengan role mekanik tidak memiliki izin memproses transaksi kasir.';
    END IF;

    -- 2. Insert Transaction Header dengan client_transaction_id
    INSERT INTO transactions (
        invoice_no,
        cashier_id,
        vehicle_id,
        total_amount,
        discount_amount,
        cash_given,
        change_amount,
        payment_method,
        status,
        notes,
        client_transaction_id
    ) VALUES (
        p_invoice_no,
        p_cashier_id,
        p_vehicle_id,
        p_total_amount,
        p_discount_amount,
        p_cash_given,
        p_change_amount,
        p_payment_method,
        'completed',
        p_notes,
        p_client_transaction_id
    ) RETURNING id INTO v_transaction_id;

    -- 3. Process each item with Row-Locking & Stock Deduction
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_qty := (v_item->>'qty')::INTEGER;
        v_item_price := (v_item->>'price')::NUMERIC;
        v_item_subtotal := v_item_qty * v_item_price;

        -- Lock the product row to prevent race conditions / overselling
        SELECT * INTO v_product
        FROM products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', (v_item->>'product_id');
        END IF;

        -- Deduct stock only for 'barang'
        IF v_product.category = 'barang' THEN
            IF v_product.stock < v_item_qty THEN
                RAISE EXCEPTION 'Stok tidak mencukupi untuk % (Sisa: %, Diminta: %)', 
                    v_product.name, v_product.stock, v_item_qty;
            END IF;

            UPDATE products
            SET stock = stock - v_item_qty,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_product.id;
        END IF;

        -- Insert Transaction Detail line item
        INSERT INTO transaction_details (
            transaction_id,
            product_id,
            qty,
            price_at_sale,
            cost_at_sale,
            subtotal
        ) VALUES (
            v_transaction_id,
            v_product.id,
            v_item_qty,
            v_item_price,
            v_product.cost_price,
            v_item_subtotal
        );
    END LOOP;

    -- 4. Update Vehicle last service date if vehicle provided
    IF p_vehicle_id IS NOT NULL THEN
        UPDATE vehicles
        SET last_service_date = CURRENT_TIMESTAMP
        WHERE id = p_vehicle_id;
    END IF;

    -- 5. Record Audit Log
    INSERT INTO audit_logs (user_id, action, details)
    VALUES (
        p_cashier_id,
        'CHECKOUT_TRANSACTION',
        jsonb_build_object(
            'transaction_id', v_transaction_id,
            'client_transaction_id', p_client_transaction_id,
            'invoice_no', p_invoice_no,
            'total', p_total_amount,
            'payment_method', p_payment_method
        )
    );

    RETURN v_transaction_id;
END;
$$;
