| index_statement                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- |
| CREATE INDEX idx_alerts_active_trigger ON public.alerts USING btree (trigger_at) WHERE (active = true);                    |
| CREATE INDEX idx_alerts_item ON public.alerts USING btree (item_id);                                                       |
| CREATE INDEX idx_attachments_item ON public.attachments USING btree (item_id);                                             |
| CREATE INDEX idx_categories_position ON public.categories USING btree ("position", name);                                  |
| CREATE INDEX idx_event_details_end ON public.event_details USING btree (end_at);                                           |
| CREATE INDEX idx_event_details_range ON public.event_details USING btree (start_at, end_at);                               |
| CREATE INDEX idx_event_details_start ON public.event_details USING btree (start_at);                                       |
| CREATE UNIQUE INDEX uq_event_details_item ON public.event_details USING btree (item_id) WHERE (item_id IS NOT NULL);       |
| CREATE INDEX idx_item_categories_category ON public.item_categories USING btree (category_id);                             |
| CREATE UNIQUE INDEX pk_item_categories ON public.item_categories USING btree (item_id, category_id);                       |
| CREATE INDEX idx_items_archived_at ON public.items USING btree (user_id, archived_at);                                     |
| CREATE INDEX idx_items_is_public ON public.items USING btree (is_public);                                                  |
| CREATE INDEX idx_items_metadata_gin ON public.items USING gin (metadata_json);                                             |
| CREATE INDEX idx_items_responsible ON public.items USING btree (responsible_user_id, is_public);                           |
| CREATE INDEX idx_items_user_priority ON public.items USING btree (user_id, priority);                                      |
| CREATE INDEX idx_items_user_status ON public.items USING btree (user_id, status);                                          |
| CREATE INDEX idx_items_user_type ON public.items USING btree (user_id, type);                                              |
| CREATE INDEX idx_recur_exceptions_rule ON public.recurrence_exceptions USING btree (rule_id);                              |
| CREATE INDEX idx_recur_rules_item ON public.recurrence_rules USING btree (item_id);                                        |
| CREATE INDEX idx_reminder_details_done ON public.reminder_details USING btree (completed_at);                              |
| CREATE INDEX idx_reminder_details_due ON public.reminder_details USING btree (due_at);                                     |
| CREATE UNIQUE INDEX uq_reminder_details_item ON public.reminder_details USING btree (item_id) WHERE (item_id IS NOT NULL); |
| CREATE INDEX idx_snoozes_alert ON public.snoozes USING btree (alert_id);                                                   |
| CREATE INDEX idx_snoozes_item ON public.snoozes USING btree (item_id);                                                     |