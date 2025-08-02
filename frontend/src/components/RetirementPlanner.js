import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api/retirement';

// Reusable Tooltip Component
const Tooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 w-64 p-3 text-sm text-white bg-gray-800 rounded-lg shadow-lg -top-2 left-6 transform -translate-y-full">
          <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 left-2 top-full -translate-y-1"></div>
          {text}
        </div>
      )}
    </div>
  );
};

// Info Icon Component
const InfoIcon = ({ tooltipText }) => (
  <Tooltip text={tooltipText}>
    <svg 
      className="w-4 h-4 text-gray-400 hover:text-gray-600 ml-1 inline-block" 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path 
        fillRule="evenodd" 
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
        clipRule="evenodd" 
      />
    </svg>
  </Tooltip>
);

function RetirementPlanner() {
  const [form, setForm] = useState({
    currentAge: '',
    retirementAge: 60,
    lifeExpectancy: 80,
    currentSalary: '',
    epfBalance: '',
    prsBalance: '',
    monthlyContributionPrs: '',
    monthlyContributionPrsPercentage: '',
    monthlyEpfContributionRate: 23,
    employeeEpfContributionRate: 11,
    targetMonthlyIncomeInput: '',
    preRetirementReturn: 4.0,
    postRetirementReturn: 4.0,
    inflationRate: 3.0,
    enableSalaryIncrements: true,
    salaryIncrementRate: 3.0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [existingPlan, setExistingPlan] = useState(null);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'results'

  // Fetch existing retirement plan
  const fetchExistingPlan = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) {
        const plan = res.data.retirementPlan;
        setExistingPlan(plan);
        setHasExistingPlan(true);
        setResult(plan);
        setViewMode('results'); // Show results if existing plan found
        
        // Populate form with existing plan data
        setForm({
          currentAge: plan.currentAge || '',
          retirementAge: plan.retirementAge || 60,
          lifeExpectancy: plan.lifeExpectancy || 80,
          currentSalary: plan.currentSalary || '',
          epfBalance: plan.epfBalance || '',
          prsBalance: plan.prsBalance || '',
          monthlyContributionPrs: plan.monthlyContributionPrs || '',
          monthlyContributionPrsPercentage: plan.monthlyContributionPrsPercentage || '',
          monthlyEpfContributionRate: plan.monthlyEpfContributionRate || 23,
          employeeEpfContributionRate: plan.employeeEpfContributionRate || 11,
          targetMonthlyIncomeInput: plan.targetMonthlyIncomeInput || '',
          preRetirementReturn: plan.preRetirementReturn || 4.0,
          postRetirementReturn: plan.postRetirementReturn || 4.0,
          inflationRate: plan.inflationRate || 3.0,
          enableSalaryIncrements: plan.enableSalaryIncrements !== undefined ? plan.enableSalaryIncrements : true,
          salaryIncrementRate: plan.salaryIncrementRate || 3.0
        });
      }
    } catch (err) {
      // If no plan exists (404), that's fine - user will create a new one
      if (err.response?.status !== 404) {
        console.error('Failed to fetch existing retirement plan:', err);
      }
      setHasExistingPlan(false);
      setExistingPlan(null);
      setViewMode('form'); // Default to form view if no existing plan
    }
  };

  useEffect(() => {
    fetchExistingPlan();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Convert form values to appropriate types
      const calculationData = {
        currentAge: parseInt(form.currentAge),
        retirementAge: parseInt(form.retirementAge),
        lifeExpectancy: parseInt(form.lifeExpectancy),
        currentSalary: parseFloat(form.currentSalary),
        epfBalance: parseFloat(form.epfBalance) || 0,
        prsBalance: parseFloat(form.prsBalance) || 0,
        monthlyContributionPrs: parseFloat(form.monthlyContributionPrs) || 0,
        monthlyContributionPrsPercentage: parseFloat(form.monthlyContributionPrsPercentage) || 0,
        monthlyEpfContributionRate: parseFloat(form.monthlyEpfContributionRate) || 23,
        employeeEpfContributionRate: parseFloat(form.employeeEpfContributionRate) || 11,
        targetMonthlyIncomeInput: form.targetMonthlyIncomeInput ? parseFloat(form.targetMonthlyIncomeInput) : null,
        preRetirementReturn: parseFloat(form.preRetirementReturn),
        postRetirementReturn: parseFloat(form.postRetirementReturn),
        inflationRate: parseFloat(form.inflationRate),
        enableSalaryIncrements: form.enableSalaryIncrements,
        salaryIncrementRate: parseFloat(form.salaryIncrementRate)
      };

      const res = await axios.post(`${API_URL}/calculate`, calculationData);
      
      if (res.data.success) {
        setResult(res.data.retirementPlan);
        setExistingPlan(res.data.retirementPlan);
        setHasExistingPlan(true);
        setError('');
        setViewMode('results'); // Switch to results view after successful calculation
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate retirement plan');
      setResult(null);
    }
    
    setLoading(false);
  };

  const handleDeletePlan = async () => {
    if (!window.confirm('Are you sure you want to delete your retirement plan? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(API_URL);
      
      // Reset the component state
      setResult(null);
      setExistingPlan(null);
      setHasExistingPlan(false);
      setViewMode('form'); // Return to form view after deletion
      
      // Reset form to default values
      setForm({
        currentAge: '',
        retirementAge: 60,
        lifeExpectancy: 80,
        currentSalary: '',
        epfBalance: '',
        prsBalance: '',
        monthlyContributionPrs: '',
        monthlyContributionPrsPercentage: '',
        monthlyEpfContributionRate: 23,
        employeeEpfContributionRate: 11,
        targetMonthlyIncomeInput: '',
        preRetirementReturn: 4.0,
        postRetirementReturn: 4.0,
        inflationRate: 3.0,
        enableSalaryIncrements: true,
        salaryIncrementRate: 3.0
      });
      
      alert('Retirement plan deleted successfully');
    } catch (err) {
      alert('Failed to delete retirement plan');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate real-time PRS contribution amount from percentage
  const calculatePrsContributionAmount = () => {
    const salary = parseFloat(form.currentSalary) || 0;
    const percentage = parseFloat(form.monthlyContributionPrsPercentage) || 0;
    return salary * (percentage / 100);
  };

  // Calculate employee EPF contribution amount
  const calculateEmployeeEpfContribution = () => {
    const salary = parseFloat(form.currentSalary) || 0;
    const percentage = parseFloat(form.employeeEpfContributionRate) || 0;
    return salary * (percentage / 100);
  };

  // Calculate disposable salary after EPF and PRS deductions
  const calculateDisposableSalary = () => {
    const salary = parseFloat(form.currentSalary) || 0;
    const employeeEpf = calculateEmployeeEpfContribution();
    const prsContribution = calculatePrsContributionAmount();
    return salary - employeeEpf - prsContribution;
  };

  const handleUpdatePlan = () => {
    setViewMode('form');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Retirement Planner</h1>
          <p className="text-lg text-gray-600">Plan your retirement fund by calculating how much you need to save for a comfortable retirement.</p>
        </div>

        {viewMode === 'form' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900">Financial Details</h2>
                {hasExistingPlan && (
                  <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    Last updated: {new Date(existingPlan?.calculationDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-8 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Age *
                      </label>
                      <input
                        type="number"
                        name="currentAge"
                        value={form.currentAge}
                        onChange={handleChange}
                        min="18"
                        max="100"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Retirement Age *
                        <InfoIcon tooltipText="The age at which you plan to stop working. This determines how many years you have to save and accumulate retirement funds. Earlier retirement requires more aggressive saving." />
                      </label>
                      <input
                        type="number"
                        name="retirementAge"
                        value={form.retirementAge}
                        onChange={handleChange}
                        min="40"
                        max="100"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Life Expectancy *
                        <InfoIcon tooltipText="How long you expect to live, which determines how long your retirement fund needs to last. A longer life expectancy means you need more savings to maintain your lifestyle throughout retirement." />
                      </label>
                      <input
                        type="number"
                        name="lifeExpectancy"
                        value={form.lifeExpectancy}
                        onChange={handleChange}
                        min="60"
                        max="120"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Monthly Salary (RM) *
                        <InfoIcon tooltipText="Your current gross monthly salary before deductions. This is used to calculate EPF contributions, PRS contributions (if percentage-based), and project future salary growth for retirement planning." />
                      </label>
                      <input
                        type="number"
                        name="currentSalary"
                        value={form.currentSalary}
                        onChange={handleChange}
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current EPF Balance (RM)
                        <InfoIcon tooltipText="Your existing EPF (Employees Provident Fund) balance. This amount will grow at an average rate of 4% annually and be included in your total retirement savings projection." />
                      </label>
                      <input
                        type="number"
                        name="epfBalance"
                        value={form.epfBalance}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Salary Increment Options */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Salary Growth Projections</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="enableSalaryIncrements"
                        checked={form.enableSalaryIncrements}
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-3 block text-sm font-medium text-gray-700">
                        Apply annual salary increments
                      </label>
                    </div>
                    
                    {form.enableSalaryIncrements && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Annual Salary Increment Rate (%)
                          <InfoIcon tooltipText="The expected annual percentage increase in your salary until retirement. This affects your EPF contributions and PRS contributions (if percentage-based), leading to higher retirement savings. Conservative estimate is 3-5%." />
                        </label>
                        <input
                          type="number"
                          name="salaryIncrementRate"
                          value={form.salaryIncrementRate}
                          onChange={handleChange}
                          min="0"
                          max="20"
                          step="0.1"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Typical range: 3-7% annually. Leave at 3% for conservative estimates.
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-600">
                      {form.enableSalaryIncrements 
                        ? `Your salary will increase by ${form.salaryIncrementRate}% annually until retirement.`
                        : 'Your salary will remain constant at the current level until retirement.'
                      }
                    </p>
                  </div>
                </div>

                {/* EPF and PRS Configuration */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">EPF & PRS Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total EPF Contribution Rate (%)
                        <InfoIcon tooltipText="The total EPF contribution rate (employee + employer). The standard Malaysian rate is 23% (11% employee + 12% employer). This is used for calculating total EPF savings." />
                      </label>
                      <input
                        type="number"
                        name="monthlyEpfContributionRate"
                        value={form.monthlyEpfContributionRate}
                        onChange={handleChange}
                        min="0"
                        max="30"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Standard: 23% (11% employee + 12% employer). Maximum: 30%
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee EPF Contribution Rate (%)
                        <InfoIcon tooltipText="The employee's portion of EPF contribution, deducted from your salary. Maximum is 11% in Malaysia. This reduces your disposable income but builds retirement savings." />
                      </label>
                      <input
                        type="number"
                        name="employeeEpfContributionRate"
                        value={form.employeeEpfContributionRate}
                        onChange={handleChange}
                        min="0"
                        max="11"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Employee contribution only. Standard: 11%. Maximum: 11%
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current PRS/Other Savings (RM)
                        <InfoIcon tooltipText="Your existing Private Retirement Scheme (PRS) balance or other investment savings. This amount will grow based on your selected pre-retirement return rate and contribute to your total retirement fund." />
                      </label>
                      <input
                        type="number"
                        name="prsBalance"
                        value={form.prsBalance}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly PRS Contribution (%)
                        <InfoIcon tooltipText="Monthly contribution to PRS as a percentage of your salary. This creates additional retirement savings beyond EPF. If salary increments are enabled, this contribution will grow with your salary over time." />
                      </label>
                      <input
                        type="number"
                        name="monthlyContributionPrsPercentage"
                        value={form.monthlyContributionPrsPercentage}
                        onChange={handleChange}
                        min="0"
                        max="20"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Percentage of your current salary. Maximum: 20%
                      </p>
                      {form.currentSalary && form.monthlyContributionPrsPercentage && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          Current contribution amount: {formatCurrency(calculatePrsContributionAmount())} per month
                          {form.enableSalaryIncrements && (
                            <span className="text-gray-500"> (will increase with salary)</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown Display */}
                {form.currentSalary && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-900 mb-4">Monthly Salary Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                      <div>
                        <p className="text-blue-700 font-medium">Gross Salary</p>
                        <p className="text-xl font-bold text-blue-800">{formatCurrency(parseFloat(form.currentSalary))}</p>
                      </div>
                      <div>
                        <p className="text-red-700 font-medium">Employee EPF ({form.employeeEpfContributionRate}%)</p>
                        <p className="text-xl font-bold text-red-800">-{formatCurrency(calculateEmployeeEpfContribution())}</p>
                      </div>
                      <div>
                        <p className="text-red-700 font-medium">PRS Contribution ({form.monthlyContributionPrsPercentage}%)</p>
                        <p className="text-xl font-bold text-red-800">-{formatCurrency(calculatePrsContributionAmount())}</p>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">Disposable Salary</p>
                        <p className="text-xl font-bold text-green-800">{formatCurrency(calculateDisposableSalary())}</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-3">
                      * Disposable salary is what remains after EPF and PRS contributions are deducted from your gross salary.
                    </p>
                  </div>
                )}

                {/* Target Monthly Income */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Retirement Income Target</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Monthly Retirement Income (RM)
                      <InfoIcon tooltipText="Your desired monthly income during retirement in today's purchasing power. This determines how much total funds you need at retirement. If not specified, the system uses 2/3 of your final salary as the target." />
                    </label>
                    <input
                      type="number"
                      name="targetMonthlyIncomeInput"
                      value={form.targetMonthlyIncomeInput}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="Leave empty to use default (2/3 of final salary)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Your desired monthly income in <strong>today's purchasing power</strong> throughout retirement. If left empty, we'll calculate 2/3 of your projected final salary.
                    </p>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pre-Retirement Return (%)
                        <InfoIcon tooltipText="Expected annual investment return rate before retirement. This affects how your PRS contributions and existing savings grow. EPF uses a fixed 4% rate. Higher returns accelerate wealth accumulation." />
                      </label>
                      <input
                        type="number"
                        name="preRetirementReturn"
                        value={form.preRetirementReturn}
                        onChange={handleChange}
                        min="0"
                        max="20"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Post-Retirement Return (%)
                        <InfoIcon tooltipText="Expected annual investment return rate during retirement. This determines how long your retirement fund will last. Conservative portfolios typically have lower but more stable returns during retirement." />
                      </label>
                      <input
                        type="number"
                        name="postRetirementReturn"
                        value={form.postRetirementReturn}
                        onChange={handleChange}
                        min="0"
                        max="20"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inflation Rate (%)
                        <InfoIcon tooltipText="Expected annual increase in cost of living. This ensures your retirement income maintains purchasing power over time. Higher inflation requires more total savings to maintain the same lifestyle." />
                      </label>
                      <input
                        type="number"
                        name="inflationRate"
                        value={form.inflationRate}
                        onChange={handleChange}
                        min="0"
                        max="20"
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium text-lg transition-colors"
                  >
                    {loading ? 'Calculating...' : hasExistingPlan ? 'Update Retirement Plan' : 'Calculate Retirement Plan'}
                  </button>
                  
                  {hasExistingPlan && (
                    <button
                      type="button"
                      onClick={handleDeletePlan}
                      className="bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-lg transition-colors"
                    >
                      Delete Plan
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {viewMode === 'results' && result && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Retirement Plan Results</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Last updated: {new Date(result.calculationDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdatePlan}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
                  >
                    Update Plan
                  </button>
                  <button
                    onClick={handleDeletePlan}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium transition-colors"
                  >
                    Delete Plan
                  </button>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-medium text-blue-900 text-lg">Last Drawn Salary</h3>
                  <p className="text-3xl font-bold text-blue-700 mt-2">{formatCurrency(result.lastDrawnSalary)}</p>
                  <p className="text-sm text-blue-600 mt-2">
                    At retirement age
                    {result.enableSalaryIncrements 
                      ? ` (${result.salaryIncrementRate}% annual growth)` 
                      : ' (no increments applied)'
                    }
                  </p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-medium text-purple-900 text-lg">Target Monthly Retirement Income</h3>
                  <p className="text-3xl font-bold text-purple-700 mt-2">{formatCurrency(result.targetMonthlyIncome)}</p>
                  <p className="text-sm text-purple-600 mt-2">
                    {form.targetMonthlyIncomeInput && parseFloat(form.targetMonthlyIncomeInput) > 0 
                      ? 'Based on your specified target' 
                      : '2/3 of your last drawn salary'
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-medium text-green-900 text-lg">Total EPF Contribution</h3>
                  <p className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(result.monthlyEpfContribution)}</p>
                  <p className="text-sm text-green-600 mt-2">{form.monthlyEpfContributionRate}% of current salary</p>
                  <div className="mt-3 text-sm text-green-700 space-y-1">
                    <p>Employee: {formatCurrency(result.monthlyEmployeeEpfContribution)} ({form.employeeEpfContributionRate}%)</p>
                    <p>Employer: {formatCurrency(result.monthlyEpfContribution - result.monthlyEmployeeEpfContribution)} ({(form.monthlyEpfContributionRate - form.employeeEpfContributionRate).toFixed(1)}%)</p>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="font-medium text-orange-900 text-lg">Disposable Monthly Salary</h3>
                  <p className="text-2xl font-bold text-orange-700 mt-2">{formatCurrency(result.disposableMonthlySalary)}</p>
                  <p className="text-sm text-orange-600 mt-2">After EPF & PRS deductions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-medium text-red-900 text-lg">Total Funds Needed</h3>
                  <p className="text-3xl font-bold text-red-700 mt-2">{formatCurrency(result.totalFundsNeeded)}</p>
                  <p className="text-sm text-red-600 mt-2">At retirement (inflation-adjusted for purchasing power)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-medium text-gray-900 text-lg">Projected EPF Balance</h3>
                  <p className="text-2xl font-bold text-gray-700 mt-2">{formatCurrency(result.projectedEpfBalance)}</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-medium text-gray-900 text-lg">Projected PRS Balance</h3>
                  <p className="text-2xl font-bold text-gray-700 mt-2">{formatCurrency(result.projectedPrsBalance)}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="font-medium text-indigo-900 text-lg">Total Projected Savings</h3>
                  <p className="text-3xl font-bold text-indigo-700 mt-2">{formatCurrency(result.totalProjectedSavings)}</p>
                </div>

                {result.fundingGap > 0 ? (
                  <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                    <h3 className="font-medium text-red-900 text-lg">Funding Gap</h3>
                    <p className="text-3xl font-bold text-red-700 mt-2">{formatCurrency(result.fundingGap)}</p>
                    <p className="text-sm text-red-600 mt-3">
                      You need an additional <strong>{formatCurrency(result.additionalMonthlySavingsRequired)}</strong> per month to meet your retirement goals.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="font-medium text-green-900 text-lg">Congratulations!</h3>
                    <p className="text-green-700 mt-2 text-lg">You're on track to meet your retirement goals!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RetirementPlanner;