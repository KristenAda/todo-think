-- rule_variable 遗漏列 snake_case 补全
ALTER TABLE `rule_variable` RENAME COLUMN `valueType` TO `value_type`;
ALTER TABLE `rule_variable` RENAME COLUMN `sourcePath` TO `source_path`;
ALTER TABLE `rule_variable` RENAME COLUMN `defaultValue` TO `default_value`;
