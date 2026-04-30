export enum RuleScopeEnum {
  GLOBAL = 'GLOBAL',
  PROJECT = 'PROJECT'
}

export enum RuleVariableValueTypeEnum {
  NUMBER = 'Number',
  FLOAT = 'Float',
  INTEGER = 'Integer'
}

export const RULE_SCOPE_OPTIONS = [
  { label: '全局', value: RuleScopeEnum.GLOBAL },
  { label: '项目', value: RuleScopeEnum.PROJECT }
] as const;

export const RULE_VARIABLE_VALUE_TYPE_OPTIONS = [
  { label: 'Number', value: RuleVariableValueTypeEnum.NUMBER },
  { label: 'Float', value: RuleVariableValueTypeEnum.FLOAT },
  { label: 'Integer', value: RuleVariableValueTypeEnum.INTEGER }
] as const;
