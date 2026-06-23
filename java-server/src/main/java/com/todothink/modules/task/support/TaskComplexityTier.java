package com.todothink.modules.task.support;

import java.util.HashMap;
import java.util.Map;

/**
 * 对齐 Node server/src/modules/task/taskComplexityTier.ts
 */
public final class TaskComplexityTier {

    private static final Map<String, Double> COEFFICIENT_BY_TIER = new HashMap<String, Double>();

    static {
        COEFFICIENT_BY_TIER.put("SIMPLE", 0.8);
        COEFFICIENT_BY_TIER.put("STANDARD", 1.0);
        COEFFICIENT_BY_TIER.put("COMPLEX", 1.2);
        COEFFICIENT_BY_TIER.put("VERY_HARD", 1.5);
    }

    private TaskComplexityTier() {
    }

    public static boolean taskSupportsTestCases(String workDomain) {
        return "SOFTWARE_DEVELOPMENT".equals(workDomain);
    }

    public static double coefficientForTier(String tier) {
        Double value = COEFFICIENT_BY_TIER.get(tier);
        if (value == null) {
            throw new IllegalArgumentException("invalid complexityTier: " + tier);
        }
        return value;
    }

    public static double coefficientForTierOrDefault(String tier) {
        Double value = COEFFICIENT_BY_TIER.get(tier != null ? tier : "STANDARD");
        return value != null ? value : 1.0;
    }

    public static double calcSuggestedBaseScore(String type, String priority, Double estimatedHours,
            String workDomain) {
        Map<String, Double> typeBase = new HashMap<String, Double>();
        typeBase.put("FEATURE", 12.0);
        typeBase.put("BUG", 10.0);
        typeBase.put("ENHANCEMENT", 8.0);
        typeBase.put("CHORE", 6.0);

        Map<String, Double> priorityFactor = new HashMap<String, Double>();
        priorityFactor.put("P0", 1.6);
        priorityFactor.put("P1", 1.3);
        priorityFactor.put("P2", 1.0);
        priorityFactor.put("P3", 0.8);

        Map<String, Double> domainFactor = new HashMap<String, Double>();
        domainFactor.put("SOFTWARE_DEVELOPMENT", 1.0);
        domainFactor.put("PRODUCT_DESIGN", 0.9);
        domainFactor.put("OPERATIONS_SUPPORT", 0.8);
        domainFactor.put("DATA_ANALYTICS", 0.95);
        domainFactor.put("GENERAL", 0.85);

        String resolvedType = type != null ? type : "FEATURE";
        String resolvedPriority = priority != null ? priority : "P2";
        String resolvedDomain = workDomain != null ? workDomain : "GENERAL";

        double base = typeBase.containsKey(resolvedType) ? typeBase.get(resolvedType) : 10.0;
        double p = priorityFactor.containsKey(resolvedPriority) ? priorityFactor.get(resolvedPriority) : 1.0;
        double d = domainFactor.containsKey(resolvedDomain) ? domainFactor.get(resolvedDomain) : 1.0;
        double hours = estimatedHours != null ? estimatedHours : 0.0;
        double hourPart = Math.min(12.0, Math.max(0.0, hours)) * 0.8;
        double score = (base + hourPart) * p * d;
        return Math.round(score * 10.0) / 10.0;
    }
}
