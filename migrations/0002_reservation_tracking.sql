ALTER TABLE order_items ADD COLUMN stock_reserved INTEGER NOT NULL DEFAULT 0 CHECK(stock_reserved IN (0,1));
DROP TRIGGER reserve_stock;
DROP TRIGGER order_status_changed;
CREATE TRIGGER reserve_stock AFTER INSERT ON order_items WHEN NEW.stock_reserved=1 BEGIN
 UPDATE products SET stock=stock-NEW.quantity,revision=revision+1 WHERE id=NEW.product_id AND stock IS NOT NULL;
END;
CREATE TRIGGER order_status_changed AFTER UPDATE OF status ON orders WHEN NEW.status!=OLD.status BEGIN
 INSERT INTO order_history(order_id,status,created_at) VALUES(NEW.id,NEW.status,NEW.updated_at);
 UPDATE products SET stock=stock+(SELECT quantity FROM order_items WHERE order_id=NEW.id AND product_id=products.id AND stock_reserved=1),revision=revision+1 WHERE NEW.status='cancelled' AND OLD.status!='cancelled' AND stock IS NOT NULL AND id IN(SELECT product_id FROM order_items WHERE order_id=NEW.id AND stock_reserved=1);
END;
