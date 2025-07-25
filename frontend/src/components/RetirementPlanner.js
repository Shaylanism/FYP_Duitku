import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api/retirement';

function RetirementPlanner() {
  const [form, setForm] = useState({
    currentAge: '',
    retirementAge: 60,
    lifeExpectancy: 80,
    currentSalary: '',
    epfBalance: '',
    prsBalance: '',
    monthlyContributionPrs: '',
    preRetirementReturn: 4.0,
    postRetirementReturn: 4.0,
    inflationRate: 3.0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch calculation history
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}?limit=5`);
      setHistory(res.data.retirementPlans || []);
    } catch (err) {
      console.error('Failed to fetch retirement plan history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
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
        preRetirementReturn: parseFloat(form.preRetirementReturn),
        postRetirementReturn: parseFloat(form.postRetirementReturn),
        inflationRate: parseFloat(form.inflationRate)
      };

      const res = await axios.post(`${API_URL}/calculate`, calculationData);
      
      if (res.data.success) {
        setResult(res.data.retirementPlan);
        setError('');
        // Refresh history
        fetchHistory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate retirement plan');
      setResult(null);
    }
    
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const deleteCalculation = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchHistory();
      if (result && result._id === id) {
        setResult(null);
      }
    } catch (err) {
      alert('Failed to delete calculation');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Retirement Planner</h1>
        <p className="text-gray-600">Plan your retirement fund by calculating how much you need to save for a comfortable retirement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retirement Age *
                </label>
                <input
                  type="number"
                  name="retirementAge"
                  value={form.retirementAge}
                  onChange={handleChange}
                  min="50"
                  max="100"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Life Expectancy *
                </label>
                <input
                  type="number"
                  name="lifeExpectancy"
                  value={form.lifeExpectancy}
                  onChange={handleChange}
                  min="60"
                  max="120"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Monthly Salary (RM) *
                </label>
                <input
                  type="number"
                  name="currentSalary"
                  value={form.currentSalary}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current EPF Balance (RM)
                </label>
                <input
                  type="number"
                  name="epfBalance"
                  value={form.epfBalance}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current PRS/Other Savings (RM)
                </label>
                <input
                  type="number"
                  name="prsBalance"
                  value={form.prsBalance}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly PRS Contribution (RM)
                </label>
                <input
                  type="number"
                  name="monthlyContributionPrs"
                  value={form.monthlyContributionPrs}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Advanced Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pre-Retirement Return (%)
                  </label>
                  <input
                    type="number"
                    name="preRetirementReturn"
                    value={form.preRetirementReturn}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Post-Retirement Return (%)
                  </label>
                  <input
                    type="number"
                    name="postRetirementReturn"
                    value={form.postRetirementReturn}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inflation Rate (%)
                  </label>
                  <input
                    type="number"
                    name="inflationRate"
                    value={form.inflationRate}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate Retirement Plan'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Retirement Plan Results</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900">Years to Retirement</h3>
                    <p className="text-2xl font-bold text-blue-700">{result.yearsToRetirement} years</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900">Last Drawn Salary</h3>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(result.lastDrawnSalary)}</p>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900">Target Monthly Retirement Income</h3>
                  <p className="text-2xl font-bold text-purple-700">{formatCurrency(result.targetMonthlyIncome)}</p>
                  <p className="text-sm text-purple-600">2/3 of your last drawn salary</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-medium text-orange-900">Total Funds Needed at Retirement</h3>
                  <p className="text-2xl font-bold text-orange-700">{formatCurrency(result.totalFundsNeeded)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">Projected EPF Balance</h3>
                    <p className="text-xl font-bold text-gray-700">{formatCurrency(result.projectedEpfBalance)}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">Projected PRS Balance</h3>
                    <p className="text-xl font-bold text-gray-700">{formatCurrency(result.projectedPrsBalance)}</p>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-medium text-indigo-900">Total Projected Savings</h3>
                  <p className="text-2xl font-bold text-indigo-700">{formatCurrency(result.totalProjectedSavings)}</p>
                </div>

                {result.fundingGap > 0 ? (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="font-medium text-red-900">Funding Gap</h3>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(result.fundingGap)}</p>
                    <p className="text-sm text-red-600 mt-2">
                      You need an additional <strong>{formatCurrency(result.additionalMonthlySavingsRequired)}</strong> per month to meet your retirement goals.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-medium text-green-900">Congratulations!</h3>
                    <p className="text-green-700">You're on track to meet your retirement goals!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Toggle */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Calculation History</h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showHistory ? 'Hide' : 'Show'} History
              </button>
            </div>
            
            {showHistory && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-gray-500">No previous calculations found.</p>
                ) : (
                  history.map((plan) => (
                    <div key={plan._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            Age {plan.currentAge} → {plan.retirementAge} (retire in {plan.yearsToRetirement} years)
                          </p>
                          <p className="text-sm text-gray-600">
                            Target: {formatCurrency(plan.targetMonthlyIncome)}/month
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(plan.calculationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteCalculation(plan._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RetirementPlanner; 