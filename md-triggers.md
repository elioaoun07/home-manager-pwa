| trigger_statement                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE TRIGGER trg_items_prevent_illegal_type_switch BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION tg_items_prevent_illegal_type_switch(); |
| CREATE TRIGGER trg_items_responsible_defaults BEFORE INSERT ON items FOR EACH ROW EXECUTE FUNCTION tg_items_responsible_defaults();               |
| CREATE TRIGGER trg_items_responsible_defaults BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION tg_items_responsible_defaults();               |