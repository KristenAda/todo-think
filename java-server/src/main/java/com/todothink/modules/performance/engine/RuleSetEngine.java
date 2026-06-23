package com.todothink.modules.performance.engine;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 规则集 DSL 求值引擎，对齐 Node settlement.service simulateRuleSetDefinition。
 */
public final class RuleSetEngine {

    private RuleSetEngine() {
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> simulateRuleSetDefinition(Map<String, Object> def, Map<String, Object> inputSnapshot) {
        Map<String, Object> ctx = new HashMap<String, Object>();
        if (inputSnapshot != null) {
            ctx.putAll(inputSnapshot);
        }
        Map<String, Object> params = def.get("params") instanceof Map
                ? (Map<String, Object>) def.get("params")
                : Collections.<String, Object>emptyMap();
        ctx.put("__params", params);
        ctx.put("__vars", new HashMap<String, Object>());

        Object variablesRaw = def.get("variables");
        if (variablesRaw instanceof List) {
            for (Object item : (List<?>) variablesRaw) {
                if (!(item instanceof Map)) {
                    continue;
                }
                Map<String, Object> vv = (Map<String, Object>) item;
                Object code = vv.get("code");
                if (code == null) {
                    continue;
                }
                Object val = evalExpr(vv.get("expr"), ctx);
                ((Map<String, Object>) ctx.get("__vars")).put(String.valueOf(code), val);
            }
        }

        List<Map<String, Object>> postings = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> metrics = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> explains = new ArrayList<Map<String, Object>>();

        List<Map<String, Object>> rules = normalizeRulesList(def.get("rules"));
        Collections.sort(rules, new Comparator<Map<String, Object>>() {
            @Override
            public int compare(Map<String, Object> a, Map<String, Object> b) {
                return priorityOf(b) - priorityOf(a);
            }
        });

        for (Map<String, Object> rule : rules) {
            if (!evalCondition(rule.get("when"), ctx)) {
                continue;
            }
            for (Object actObj : normalizeThenList(rule)) {
                if (!(actObj instanceof Map)) {
                    continue;
                }
                Map<String, Object> act = (Map<String, Object>) actObj;
                if (isEmitPostingAction(act)) {
                    int amount = (int) Math.round(evalExpr(act.get("amount"), ctx));
                    if (amount == 0) {
                        continue;
                    }
                    Object subject = act.get("subject");
                    String refMany = subject instanceof Map && ((Map<?, ?>) subject).get("refMany") != null
                            ? String.valueOf(((Map<?, ?>) subject).get("refMany")).trim()
                            : "";
                    if (!refMany.isEmpty()) {
                        for (Integer subjectId : normalizePostingSubjectIds(getPath(ctx, refMany))) {
                            postings.add(buildPosting(subjectId, act, rule, amount));
                        }
                        continue;
                    }
                    String refOne = subject instanceof Map && ((Map<?, ?>) subject).get("ref") != null
                            ? String.valueOf(((Map<?, ?>) subject).get("ref")).trim()
                            : "";
                    int subjectId = refOne.isEmpty() ? 0 : toInt(getPath(ctx, refOne));
                    if (subjectId <= 0) {
                        continue;
                    }
                    postings.add(buildPosting(subjectId, act, rule, amount));
                }
                if (isEmitMetricAction(act)) {
                    Object subject = act.get("subject");
                    if (!(subject instanceof Map)) {
                        continue;
                    }
                    int subjectId = toInt(getPath(ctx, String.valueOf(((Map<?, ?>) subject).get("ref"))));
                    if (subjectId <= 0) {
                        continue;
                    }
                    Map<String, Object> metric = new LinkedHashMap<String, Object>();
                    metric.put("subjectType", "USER");
                    metric.put("subjectId", subjectId);
                    metric.put("metricCode", act.get("metricCode"));
                    metric.put("value", evalExpr(act.get("value"), ctx));
                    metric.put("reasonCode", act.get("reasonCode") != null ? act.get("reasonCode") : rule.get("id"));
                    metric.put("ruleId", rule.get("id"));
                    metrics.add(metric);
                }
            }
            Map<String, Object> explain = new LinkedHashMap<String, Object>();
            explain.put("ruleId", rule.get("id"));
            explain.put("ok", true);
            explains.add(explain);
        }

        Map<String, Object> output = new LinkedHashMap<String, Object>();
        output.put("postings", postings);
        output.put("metrics", metrics);
        output.put("explains", explains);
        return output;
    }

    private static Map<String, Object> buildPosting(int subjectId, Map<String, Object> act, Map<String, Object> rule,
            int amount) {
        Map<String, Object> posting = new LinkedHashMap<String, Object>();
        posting.put("subjectType", "USER");
        posting.put("subjectId", subjectId);
        posting.put("pointsType", act.get("pointsType"));
        posting.put("amount", amount);
        posting.put("reasonCode", act.get("reasonCode") != null ? act.get("reasonCode") : rule.get("id"));
        posting.put("ruleId", rule.get("id"));
        return posting;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> normalizeRulesList(Object rules) {
        if (rules instanceof List) {
            List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
            for (Object item : (List<?>) rules) {
                if (item instanceof Map) {
                    out.add((Map<String, Object>) item);
                }
            }
            return out;
        }
        if (rules instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) rules;
            List<String> keys = new ArrayList<String>(map.keySet());
            Collections.sort(keys, new Comparator<String>() {
                @Override
                public int compare(String a, String b) {
                    try {
                        return Integer.compare(Integer.parseInt(a), Integer.parseInt(b));
                    } catch (NumberFormatException ex) {
                        return a.compareTo(b);
                    }
                }
            });
            List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
            for (String key : keys) {
                Object val = map.get(key);
                if (val instanceof Map) {
                    out.add((Map<String, Object>) val);
                }
            }
            return out;
        }
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    private static List<Object> normalizeThenList(Map<String, Object> rule) {
        Object thenRaw = rule.get("then") != null ? rule.get("then") : rule.get("actions");
        if (thenRaw instanceof List) {
            return (List<Object>) thenRaw;
        }
        if (thenRaw != null) {
            return Collections.<Object>singletonList(thenRaw);
        }
        return Collections.emptyList();
    }

    private static int priorityOf(Map<String, Object> rule) {
        Object p = rule.get("priority");
        return p instanceof Number ? ((Number) p).intValue() : 0;
    }

    private static String actionKind(Object type) {
        return String.valueOf(type == null ? "" : type).replaceAll("[-_\\s]", "").toLowerCase();
    }

    private static boolean isEmitPostingAction(Map<String, Object> act) {
        return "emitposting".equals(actionKind(act.get("type")));
    }

    private static boolean isEmitMetricAction(Map<String, Object> act) {
        return "emitmetric".equals(actionKind(act.get("type")));
    }

    @SuppressWarnings("unchecked")
    private static Object getPath(Object obj, String path) {
        if (path == null || path.isEmpty()) {
            return null;
        }
        String[] segs = path.split("\\.");
        Object cur = obj;
        for (String seg : segs) {
            if (cur == null) {
                return null;
            }
            if (cur instanceof Map) {
                cur = ((Map<String, Object>) cur).get(seg);
            } else {
                return null;
            }
        }
        return cur;
    }

    private static List<Integer> normalizePostingSubjectIds(Object raw) {
        if (!(raw instanceof List)) {
            return Collections.emptyList();
        }
        List<Integer> ids = new ArrayList<Integer>();
        for (Object x : (List<?>) raw) {
            int n = toInt(x);
            if (n > 0 && !ids.contains(n)) {
                ids.add(n);
            }
        }
        return ids;
    }

    @SuppressWarnings("unchecked")
    private static double evalExpr(Object expr, Map<String, Object> ctx) {
        if (expr == null) {
            return 0;
        }
        if (expr instanceof Number) {
            return ((Number) expr).doubleValue();
        }
        if (!(expr instanceof Map)) {
            return 0;
        }
        Map<String, Object> map = (Map<String, Object>) expr;
        if (map.containsKey("path")) {
            return toDouble(getPath(ctx, String.valueOf(map.get("path"))));
        }
        if (map.containsKey("var")) {
            Map<String, Object> vars = (Map<String, Object>) ctx.get("__vars");
            return toDouble(vars != null ? vars.get(String.valueOf(map.get("var"))) : 0);
        }
        if (map.containsKey("param")) {
            Map<String, Object> params = (Map<String, Object>) ctx.get("__params");
            return toDouble(params != null ? params.get(String.valueOf(map.get("param"))) : 0);
        }
        if (map.containsKey("fn")) {
            String fn = String.valueOf(map.get("fn"));
            List<Object> args = map.get("args") instanceof List ? (List<Object>) map.get("args")
                    : Collections.<Object>emptyList();
            switch (fn) {
                case "add":
                    double sum = 0;
                    for (Object a : args) {
                        sum += evalExpr(a, ctx);
                    }
                    return sum;
                case "sub":
                    return evalExpr(argAt(args, 0), ctx) - evalExpr(argAt(args, 1), ctx);
                case "mul":
                    double prod = 1;
                    for (Object a : args) {
                        prod *= evalExpr(a, ctx);
                    }
                    return prod;
                case "div":
                    double b = evalExpr(argAt(args, 1), ctx);
                    return b == 0 ? 0 : evalExpr(argAt(args, 0), ctx) / b;
                case "max":
                    double max = Double.NEGATIVE_INFINITY;
                    for (Object a : args) {
                        max = Math.max(max, evalExpr(a, ctx));
                    }
                    return max;
                case "min":
                    double min = Double.POSITIVE_INFINITY;
                    for (Object a : args) {
                        min = Math.min(min, evalExpr(a, ctx));
                    }
                    return min;
                case "round":
                    return Math.round(evalExpr(argAt(args, 0), ctx));
                case "piecewise":
                    for (Object pieceObj : args) {
                        if (!(pieceObj instanceof Map)) {
                            continue;
                        }
                        Map<String, Object> piece = (Map<String, Object>) pieceObj;
                        if (piece.get("when") != null && evalCondition(piece.get("when"), ctx)) {
                            return evalExpr(piece.get("value"), ctx);
                        }
                    }
                    return 0;
                case "formula":
                    return evalFormulaString(String.valueOf(argAt(args, 0)), ctx);
                default:
                    return 0;
            }
        }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private static double evalFormulaString(String formulaText, Map<String, Object> ctx) {
        String text = formulaText == null ? "" : formulaText.trim();
        if (text.isEmpty()) {
            return 0;
        }
        Map<String, Object> merged = new HashMap<String, Object>();
        Map<String, Object> params = (Map<String, Object>) ctx.get("__params");
        if (params != null) {
            merged.putAll(params);
        }
        Map<String, Object> vars = (Map<String, Object>) ctx.get("__vars");
        if (vars != null) {
            merged.putAll(vars);
        }
        Object taskObj = ctx.get("task");
        if (taskObj instanceof Map) {
            merged.putAll((Map<String, Object>) taskObj);
        }
        try {
            javax.script.ScriptEngine engine = new javax.script.ScriptEngineManager().getEngineByName("JavaScript");
            if (engine == null) {
                return 0;
            }
            javax.script.Bindings bindings = engine.createBindings();
            for (Map.Entry<String, Object> entry : merged.entrySet()) {
                bindings.put(entry.getKey(), entry.getValue());
            }
            String wrapped = "var max=function(){return Math.max.apply(Math,arguments);};"
                    + "var min=function(){return Math.min.apply(Math,arguments);};"
                    + "var abs=Math.abs;var round=Math.round;(" + text + ")";
            Object result = engine.eval(wrapped, bindings);
            double n = toDouble(result);
            return Double.isFinite(n) ? n : 0;
        } catch (Exception ex) {
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    private static boolean evalCondition(Object condObj, Map<String, Object> ctx) {
        if (condObj == null) {
            return true;
        }
        if (!(condObj instanceof Map)) {
            return false;
        }
        Map<String, Object> cond = (Map<String, Object>) condObj;
        if (cond.containsKey("all")) {
            for (Object c : (List<?>) cond.get("all")) {
                if (!evalCondition(c, ctx)) {
                    return false;
                }
            }
            return true;
        }
        if (cond.containsKey("any")) {
            for (Object c : (List<?>) cond.get("any")) {
                if (evalCondition(c, ctx)) {
                    return true;
                }
            }
            return false;
        }
        if (cond.containsKey("not")) {
            return !evalCondition(cond.get("not"), ctx);
        }
        Object left = cond.get("left");
        Object right = cond.get("right");
        Object leftVal = left instanceof Map ? evalExpr(left, ctx) : left;
        Object rightVal = right instanceof Map ? evalExpr(right, ctx) : right;
        String op = String.valueOf(cond.get("op"));
        switch (op) {
            case "eq":
                return eq(leftVal, rightVal);
            case "ne":
                return !eq(leftVal, rightVal);
            case "gt":
                return toDouble(leftVal) > toDouble(rightVal);
            case "gte":
                return toDouble(leftVal) >= toDouble(rightVal);
            case "lt":
                return toDouble(leftVal) < toDouble(rightVal);
            case "lte":
                return toDouble(leftVal) <= toDouble(rightVal);
            default:
                return false;
        }
    }

    private static boolean eq(Object a, Object b) {
        if (a == null) {
            return b == null;
        }
        return a.equals(b);
    }

    private static Object argAt(List<Object> args, int index) {
        return args.size() > index ? args.get(index) : 0;
    }

    private static int toInt(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return (int) Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private static double toDouble(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
