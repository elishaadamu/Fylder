export const fetchDataPlans = async () => {
  try {
    // Update the path to be relative to the public directory
    const response = await fetch("/data_plan/dataPlan.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const plans = await response.json();
    return plans;
  } catch (error) {
    return [];
  }
};

export const getDataPlansByType = async (planType) => {
  try {
    const allPlans = await fetchDataPlans();
    const filteredPlans = allPlans.filter(
      (plan) => plan.plan_type === planType
    );

    return {
      planType,
      plans: filteredPlans,
    };
  } catch (error) {
    return {
      planType,
      plans: [],
    };
  }
};
