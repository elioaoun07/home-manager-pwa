| constraint_statement                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ALTER TABLE alerts ADD CONSTRAINT 2200_17541_10_not_null;                                                                                                                      |
| ALTER TABLE alerts ADD CONSTRAINT 2200_17541_12_not_null;                                                                                                                      |
| ALTER TABLE alerts ADD CONSTRAINT 2200_17541_13_not_null;                                                                                                                      |
| ALTER TABLE alerts ADD CONSTRAINT 2200_17541_1_not_null;                                                                                                                       |
| ALTER TABLE alerts ADD CONSTRAINT 2200_17541_2_not_null;                                                                                                                       |
| ALTER TABLE alerts ADD CONSTRAINT 2200_17541_3_not_null;                                                                                                                       |
| ALTER TABLE alerts ADD CONSTRAINT 2200_17541_9_not_null;                                                                                                                       |
| ALTER TABLE alerts ADD CONSTRAINT alerts_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE;                                          |
| ALTER TABLE alerts ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);                                                                                                                |
| ALTER TABLE attachments ADD CONSTRAINT 2200_17573_1_not_null;                                                                                                                  |
| ALTER TABLE attachments ADD CONSTRAINT 2200_17573_2_not_null;                                                                                                                  |
| ALTER TABLE attachments ADD CONSTRAINT 2200_17573_7_not_null;                                                                                                                  |
| ALTER TABLE attachments ADD CONSTRAINT attachments_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE;                                |
| ALTER TABLE attachments ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);                                                                                                      |
| ALTER TABLE categories ADD CONSTRAINT 2200_17427_1_not_null;                                                                                                                   |
| ALTER TABLE categories ADD CONSTRAINT 2200_17427_3_not_null;                                                                                                                   |
| ALTER TABLE categories ADD CONSTRAINT 2200_17427_5_not_null;                                                                                                                   |
| ALTER TABLE categories ADD CONSTRAINT 2200_17427_6_not_null;                                                                                                                   |
| ALTER TABLE categories ADD CONSTRAINT 2200_17427_7_not_null;                                                                                                                   |
| ALTER TABLE categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);                                                                                                        |
| ALTER TABLE event_details ADD CONSTRAINT 2200_17475_1_not_null;                                                                                                                |
| ALTER TABLE event_details ADD CONSTRAINT 2200_17475_2_not_null;                                                                                                                |
| ALTER TABLE event_details ADD CONSTRAINT 2200_17475_3_not_null;                                                                                                                |
| ALTER TABLE event_details ADD CONSTRAINT 2200_17475_4_not_null;                                                                                                                |
| ALTER TABLE event_details ADD CONSTRAINT chk_event_time_range;                                                                                                                 |
| ALTER TABLE event_details ADD CONSTRAINT event_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE;                            |
| ALTER TABLE event_details ADD CONSTRAINT event_details_pkey PRIMARY KEY (item_id);                                                                                             |
| ALTER TABLE item_categories ADD CONSTRAINT 2200_17460_1_not_null;                                                                                                              |
| ALTER TABLE item_categories ADD CONSTRAINT 2200_17460_2_not_null;                                                                                                              |
| ALTER TABLE item_categories ADD CONSTRAINT item_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE;           |
| ALTER TABLE item_categories ADD CONSTRAINT item_categories_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE;                        |
| ALTER TABLE item_categories ADD CONSTRAINT pk_item_categories PRIMARY KEY (item_id, category_id);                                                                              |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_10_not_null;                                                                                                                       |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_12_not_null;                                                                                                                       |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_13_not_null;                                                                                                                       |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_1_not_null;                                                                                                                        |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_2_not_null;                                                                                                                        |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_3_not_null;                                                                                                                        |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_4_not_null;                                                                                                                        |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_6_not_null;                                                                                                                        |
| ALTER TABLE items ADD CONSTRAINT 2200_17444_9_not_null;                                                                                                                        |
| null                                                                                                                                                                           |
| null                                                                                                                                                                           |
| ALTER TABLE items ADD CONSTRAINT items_pkey PRIMARY KEY (id);                                                                                                                  |
| ALTER TABLE recurrence_exceptions ADD CONSTRAINT 2200_17528_1_not_null;                                                                                                        |
| ALTER TABLE recurrence_exceptions ADD CONSTRAINT 2200_17528_2_not_null;                                                                                                        |
| ALTER TABLE recurrence_exceptions ADD CONSTRAINT 2200_17528_3_not_null;                                                                                                        |
| ALTER TABLE recurrence_exceptions ADD CONSTRAINT recurrence_exceptions_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES recurrence_rules(id) ON DELETE CASCADE ON UPDATE CASCADE; |
| ALTER TABLE recurrence_exceptions ADD CONSTRAINT recurrence_exceptions_pkey PRIMARY KEY (id);                                                                                  |
| ALTER TABLE recurrence_rules ADD CONSTRAINT 2200_17515_1_not_null;                                                                                                             |
| ALTER TABLE recurrence_rules ADD CONSTRAINT 2200_17515_2_not_null;                                                                                                             |
| ALTER TABLE recurrence_rules ADD CONSTRAINT 2200_17515_3_not_null;                                                                                                             |
| ALTER TABLE recurrence_rules ADD CONSTRAINT 2200_17515_4_not_null;                                                                                                             |
| ALTER TABLE recurrence_rules ADD CONSTRAINT recurrence_rules_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE;                      |
| ALTER TABLE recurrence_rules ADD CONSTRAINT recurrence_rules_pkey PRIMARY KEY (id);                                                                                            |
| ALTER TABLE reminder_details ADD CONSTRAINT 2200_17488_1_not_null;                                                                                                             |
| ALTER TABLE reminder_details ADD CONSTRAINT 2200_17488_5_not_null;                                                                                                             |
| ALTER TABLE reminder_details ADD CONSTRAINT chk_reminder_completed_after_due;                                                                                                  |
| ALTER TABLE reminder_details ADD CONSTRAINT chk_reminder_estimate_nonneg;                                                                                                      |
| ALTER TABLE reminder_details ADD CONSTRAINT reminder_details_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE;                      |
| ALTER TABLE reminder_details ADD CONSTRAINT reminder_details_pkey PRIMARY KEY (item_id);                                                                                       |
| ALTER TABLE snoozes ADD CONSTRAINT 2200_17556_1_not_null;                                                                                                                      |
| ALTER TABLE snoozes ADD CONSTRAINT 2200_17556_2_not_null;                                                                                                                      |
| ALTER TABLE snoozes ADD CONSTRAINT 2200_17556_3_not_null;                                                                                                                      |
| ALTER TABLE snoozes ADD CONSTRAINT 2200_17556_4_not_null;                                                                                                                      |
| ALTER TABLE snoozes ADD CONSTRAINT 2200_17556_5_not_null;                                                                                                                      |
| ALTER TABLE snoozes ADD CONSTRAINT snoozes_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE ON UPDATE CASCADE;                                     |
| ALTER TABLE snoozes ADD CONSTRAINT snoozes_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE;                                        |
| ALTER TABLE snoozes ADD CONSTRAINT snoozes_pkey PRIMARY KEY (id);                                                                                                              |
| ALTER TABLE subtasks ADD CONSTRAINT 2200_17499_1_not_null;                                                                                                                     |
| ALTER TABLE subtasks ADD CONSTRAINT 2200_17499_2_not_null;                                                                                                                     |
| ALTER TABLE subtasks ADD CONSTRAINT 2200_17499_3_not_null;                                                                                                                     |
| ALTER TABLE subtasks ADD CONSTRAINT 2200_17499_5_not_null;                                                                                                                     |
| ALTER TABLE subtasks ADD CONSTRAINT 2200_17499_6_not_null;                                                                                                                     |
| ALTER TABLE subtasks ADD CONSTRAINT 2200_17499_7_not_null;                                                                                                                     |
| ALTER TABLE subtasks ADD CONSTRAINT subtasks_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES items(id) ON DELETE CASCADE ON UPDATE CASCADE;                        |
| ALTER TABLE subtasks ADD CONSTRAINT subtasks_pkey PRIMARY KEY (id);                                                                                                            |