| policy_statement                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CREATE POLICY alerts_del ON alerts FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = alerts.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                                                |
| CREATE POLICY alerts_ins ON alerts FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = alerts.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                                           |
| CREATE POLICY alerts_sel ON alerts FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = alerts.item_id) AND ((items.user_id = auth.uid()) OR (items.is_public = true))))));                                                                                                                                  |
| CREATE POLICY alerts_upd ON alerts FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = alerts.item_id) AND (items.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = alerts.item_id) AND (items.user_id = auth.uid())))));                                         |
| CREATE POLICY attachments_del ON attachments FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = attachments.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                                 |
| CREATE POLICY attachments_ins ON attachments FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = attachments.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                            |
| CREATE POLICY attachments_sel ON attachments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = attachments.item_id) AND ((items.user_id = auth.uid()) OR (items.is_public = true))))));                                                                                                                   |
| CREATE POLICY attachments_upd ON attachments FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = attachments.item_id) AND (items.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = attachments.item_id) AND (items.user_id = auth.uid())))));                     |
| CREATE POLICY categories_del ON categories FOR DELETE TO authenticated USING (true);                                                                                                                                                                                                                                                             |
| CREATE POLICY categories_delete ON categories FOR DELETE TO authenticated USING (true);                                                                                                                                                                                                                                                          |
| CREATE POLICY categories_ins ON categories FOR INSERT TO authenticated WITH CHECK (true);                                                                                                                                                                                                                                                        |
| CREATE POLICY categories_insert ON categories FOR INSERT TO authenticated WITH CHECK (true);                                                                                                                                                                                                                                                     |
| CREATE POLICY categories_sel ON categories FOR SELECT TO authenticated USING (true);                                                                                                                                                                                                                                                             |
| CREATE POLICY categories_upd ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);                                                                                                                                                                                                                                           |
| CREATE POLICY categories_update ON categories FOR UPDATE TO authenticated USING (true);                                                                                                                                                                                                                                                          |
| CREATE POLICY event_details_del ON event_details FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = event_details.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                           |
| CREATE POLICY event_details_ins ON event_details FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = event_details.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                      |
| CREATE POLICY event_details_sel ON event_details FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = event_details.item_id) AND ((items.user_id = auth.uid()) OR (items.is_public = true))))));                                                                                                             |
| CREATE POLICY event_details_upd ON event_details FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = event_details.item_id) AND (items.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = event_details.item_id) AND (items.user_id = auth.uid())))));             |
| CREATE POLICY item_categories_del ON item_categories FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = item_categories.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                     |
| CREATE POLICY item_categories_ins ON item_categories FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = item_categories.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                |
| CREATE POLICY item_categories_sel ON item_categories FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = item_categories.item_id) AND ((items.user_id = auth.uid()) OR (items.is_public = true))))));                                                                                                       |
| CREATE POLICY item_categories_upd ON item_categories FOR UPDATE TO authenticated USING (owns_item(item_id)) WITH CHECK (owns_item(item_id));                                                                                                                                                                                                     |
| CREATE POLICY items_del ON items FOR DELETE TO authenticated USING ((user_id = auth.uid()));                                                                                                                                                                                                                                                     |
| CREATE POLICY items_ins ON items FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));                                                                                                                                                                                                                                                |
| CREATE POLICY items_sel ON items FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (is_public = true)));                                                                                                                                                                                                                             |
| CREATE POLICY items_upd ON items FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));                                                                                                                                                                                                                 |
| CREATE POLICY recurrence_exceptions_del ON recurrence_exceptions FOR DELETE TO authenticated USING (owns_rule(rule_id));                                                                                                                                                                                                                         |
| CREATE POLICY recurrence_exceptions_ins ON recurrence_exceptions FOR INSERT TO authenticated WITH CHECK (owns_rule(rule_id));                                                                                                                                                                                                                    |
| CREATE POLICY recurrence_exceptions_sel ON recurrence_exceptions FOR SELECT TO authenticated USING (has_rule_access(rule_id));                                                                                                                                                                                                                   |
| CREATE POLICY recurrence_exceptions_upd ON recurrence_exceptions FOR UPDATE TO authenticated USING (owns_rule(rule_id)) WITH CHECK (owns_rule(rule_id));                                                                                                                                                                                         |
| CREATE POLICY recurrence_rules_del ON recurrence_rules FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = recurrence_rules.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                  |
| CREATE POLICY recurrence_rules_ins ON recurrence_rules FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = recurrence_rules.item_id) AND (items.user_id = auth.uid())))));                                                                                                                             |
| CREATE POLICY recurrence_rules_sel ON recurrence_rules FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = recurrence_rules.item_id) AND ((items.user_id = auth.uid()) OR (items.is_public = true))))));                                                                                                    |
| CREATE POLICY recurrence_rules_upd ON recurrence_rules FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = recurrence_rules.item_id) AND (items.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = recurrence_rules.item_id) AND (items.user_id = auth.uid()))))); |
| CREATE POLICY reminder_details_del ON reminder_details FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = reminder_details.item_id) AND (items.user_id = auth.uid())))));                                                                                                                                  |
| CREATE POLICY reminder_details_ins ON reminder_details FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = reminder_details.item_id) AND (items.user_id = auth.uid())))));                                                                                                                             |
| CREATE POLICY reminder_details_sel ON reminder_details FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = reminder_details.item_id) AND ((items.user_id = auth.uid()) OR (items.is_public = true))))));                                                                                                    |
| CREATE POLICY reminder_details_upd ON reminder_details FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = reminder_details.item_id) AND (items.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = reminder_details.item_id) AND (items.user_id = auth.uid()))))); |
| CREATE POLICY snoozes_del ON snoozes FOR DELETE TO authenticated USING (owns_item(item_id));                                                                                                                                                                                                                                                     |
| CREATE POLICY snoozes_ins ON snoozes FOR INSERT TO authenticated WITH CHECK (owns_item(item_id));                                                                                                                                                                                                                                                |
| CREATE POLICY snoozes_sel ON snoozes FOR SELECT TO authenticated USING (has_item_access(item_id));                                                                                                                                                                                                                                               |
| CREATE POLICY snoozes_upd ON snoozes FOR UPDATE TO authenticated USING (owns_item(item_id)) WITH CHECK (owns_item(item_id));                                                                                                                                                                                                                     |
| CREATE POLICY subtasks_del ON subtasks FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = subtasks.parent_item_id) AND (items.user_id = auth.uid())))));                                                                                                                                                   |
| CREATE POLICY subtasks_ins ON subtasks FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = subtasks.parent_item_id) AND (items.user_id = auth.uid())))));                                                                                                                                              |
| CREATE POLICY subtasks_sel ON subtasks FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = subtasks.parent_item_id) AND ((items.user_id = auth.uid()) OR (items.is_public = true))))));                                                                                                                     |
| CREATE POLICY subtasks_upd ON subtasks FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = subtasks.parent_item_id) AND (items.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM items
  WHERE ((items.id = subtasks.parent_item_id) AND (items.user_id = auth.uid())))));                   |