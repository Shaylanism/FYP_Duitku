import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentMonth } from '../utils/monthUtils';
import MonthFilter from './MonthFilter';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const FinancialReportExport = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [useAlternativeMethod, setUseAlternativeMethod] = useState(false);
  const [dynamicLibrariesLoaded, setDynamicLibrariesLoaded] = useState(false);
  const [dynamicLibraries, setDynamicLibraries] = useState(null);
  const { user } = useAuth();

  // Load PDF libraries dynamically for alternative method
  const loadDynamicPDFLibraries = async () => {
    try {
      // Load jsPDF module
      const jsPDFModule = await import('jspdf');
      
      // Try multiple ways to get the jsPDF constructor
      let jsPDFClass = jsPDFModule.jsPDF || jsPDFModule.default;
      
      // Handle case where the module might be wrapped in another object
      if (typeof jsPDFClass === 'object' && jsPDFClass.jsPDF) {
        jsPDFClass = jsPDFClass.jsPDF;
      }
      
      // Final fallback - try the entire module if it's a function
      if (typeof jsPDFClass !== 'function' && typeof jsPDFModule === 'function') {
        jsPDFClass = jsPDFModule;
      }
      
      if (typeof jsPDFClass !== 'function') {
        throw new Error('Could not find jsPDF constructor in dynamic import');
      }
      
      // Load autoTable module
      const autoTableModule = await import('jspdf-autotable');
      let autoTableFunction = autoTableModule.default || autoTableModule;
      
      // Handle different export patterns for autoTable
      if (typeof autoTableFunction === 'object') {
        if (typeof autoTableFunction.autoTable === 'function') {
          autoTableFunction = autoTableFunction.autoTable;
        } else if (typeof autoTableFunction.default === 'function') {
          autoTableFunction = autoTableFunction.default;
        }
      }
      
      if (typeof autoTableFunction !== 'function') {
        throw new Error('Could not find autoTable function in dynamic import');
      }
      
      // Store the libraries in state to ensure they persist
      const libraries = {
        jsPDF: jsPDFClass,
        autoTable: autoTableFunction
      };
      
      setDynamicLibraries(libraries);
      return true;
    } catch (error) {
      console.error('Dynamic import error:', error);
      setError(`Failed to load dynamic libraries: ${error.message}`);
      return false;
    }
  };

  // Load dynamic libraries when alternative method is enabled
  useEffect(() => {
    if (useAlternativeMethod && !dynamicLibrariesLoaded) {
      loadDynamicPDFLibraries().then(loaded => {
        setDynamicLibrariesLoaded(loaded);
        if (!loaded) {
          setError('Failed to load PDF libraries with alternative method. Please try the standard method.');
        }
      });
    }
  }, [useAlternativeMethod, dynamicLibrariesLoaded]);

  // Fetch comprehensive financial data for preview
  const fetchTransactionData = async (month) => {
    setLoading(true);
    setError('');
    try {
      // Fetch transactions, budgets, and planned payments in parallel
      const [transactionsRes, budgetsRes, plannedPaymentsRes] = await Promise.all([
        axios.get('/api/transactions', { params: { month } }),
        axios.get('/api/budgets', { params: { month, limit: 1000 } }), // High limit to get all budgets
        axios.get('/api/planned-payments', { params: { limit: 1000 } }) // Get all planned payments
      ]);

      // Filter planned payments for the selected month
      const filteredPlannedPayments = filterPlannedPaymentsByMonth(
        plannedPaymentsRes.data.plannedPayments || [], 
        month
      );

      // Combine all data
      const combinedData = {
        ...transactionsRes.data,
        budgets: budgetsRes.data.budgets || [],
        budgetSummary: budgetsRes.data.summary || { totalBudgetAmount: 0 },
        plannedPayments: filteredPlannedPayments,
        plannedPaymentSummary: calculatePlannedPaymentSummary(filteredPlannedPayments)
      };

      setPreviewData(combinedData);
    } catch (err) {
      setError('Failed to fetch financial data');
    }
    setLoading(false);
  };

  // Helper function to filter planned payments by month
  const filterPlannedPaymentsByMonth = (payments, targetMonth) => {
    if (!payments || !targetMonth) return [];

    const [year, month] = targetMonth.split('-').map(Number);
    
    return payments.filter(payment => {
      if (!payment.isActive) return false;
      
      // Check if payment is due in the target month
      const targetDate = new Date(year, month - 1, 1); // First day of target month
      const dueDate = new Date(year, month - 1, Math.min(payment.dueDay, new Date(year, month, 0).getDate()));
      
      return dueDate.getFullYear() === year && dueDate.getMonth() === (month - 1);
    });
  };

  // Helper function to calculate planned payment summary
  const calculatePlannedPaymentSummary = (payments) => {
    const summary = {
      totalAmount: 0,
      count: payments.length,
      byCategory: {}
    };

    payments.forEach(payment => {
      summary.totalAmount += payment.amount;
      
      if (!summary.byCategory[payment.category]) {
        summary.byCategory[payment.category] = {
          count: 0,
          amount: 0
        };
      }
      summary.byCategory[payment.category].count += 1;
      summary.byCategory[payment.category].amount += payment.amount;
    });

    return summary;
  };

  useEffect(() => {
    fetchTransactionData(selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };





  const generatePDF = async () => {
    if (!previewData) {
      setError('No financial data available to export');
      return;
    }

    // Check if alternative method is selected and libraries are loaded
    if (useAlternativeMethod && (!dynamicLibrariesLoaded || !dynamicLibraries)) {
      setError('Alternative method libraries not loaded yet. Please wait or try the standard method.');
      return;
    }

    setGeneratingPDF(true);
    setError('');

    try {
      // Use appropriate jsPDF and autoTable based on selected method
      const PDFClass = useAlternativeMethod ? dynamicLibraries.jsPDF : jsPDF;
      const tableFunction = useAlternativeMethod ? dynamicLibraries.autoTable : autoTable;
      

      
      // Validate the constructor before using it
      if (typeof PDFClass !== 'function') {
        throw new Error(`PDF library not properly loaded: expected function, got ${typeof PDFClass}`);
      }
      
      if (typeof tableFunction !== 'function') {
        throw new Error(`AutoTable library not properly loaded: expected function, got ${typeof tableFunction}`);
      }
      
      const doc = new PDFClass();
    
    // Set document title
    const monthYear = new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Month: ${monthYear}`, 105, 30, { align: 'center' });
    doc.text(`User: ${user?.name || 'N/A'}`, 105, 38, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US')}`, 105, 46, { align: 'center' });

    // Summary section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 20, 60);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Income: ${formatCurrency(previewData.summary?.totalIncome || 0)}`, 20, 70);
    doc.text(`Total Expenses: ${formatCurrency(previewData.summary?.totalExpense || 0)}`, 20, 78);
    doc.text(`Total Budget: ${formatCurrency(previewData.budgetSummary?.totalBudgetAmount || 0)}`, 20, 86);
    doc.text(`Planned Payments: ${formatCurrency(previewData.plannedPaymentSummary?.totalAmount || 0)}`, 20, 94);
    
    const balance = previewData.summary?.balance || 0;
    doc.setFont('helvetica', 'bold');
    doc.text(`Net Balance: ${formatCurrency(balance)}`, 20, 102);
    
    // Transactions table
    if (previewData.transactions.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction Details', 20, 115);

      // Prepare data for table
      const tableData = previewData.transactions.map(transaction => [
        formatDate(transaction.createdAt),
        transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        transaction.description,
        transaction.category,
        `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}`
      ]);

      // Add table
      tableFunction(doc, {
        head: [['Date', 'Type', 'Description', 'Category', 'Amount']],
        body: tableData,
        startY: 125,
        theme: 'striped',
        headStyles: { 
          fillColor: [66, 139, 202],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Date
          1: { cellWidth: 20 }, // Type
          2: { cellWidth: 45 }, // Description
          3: { cellWidth: 30 }, // Category
          4: { cellWidth: 30, halign: 'right' } // Amount
        },
        margin: { left: 20, right: 20 },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3,
          fontSize: 9
        }
      });

      // Category breakdown
      const categoryBreakdown = {};
      previewData.transactions.forEach(transaction => {
        const key = `${transaction.type}-${transaction.category}`;
        if (!categoryBreakdown[key]) {
          categoryBreakdown[key] = {
            type: transaction.type,
            category: transaction.category,
            total: 0,
            count: 0
          };
        }
        categoryBreakdown[key].total += transaction.amount;
        categoryBreakdown[key].count += 1;
      });

      // Get current Y position after transactions table
      let currentY = doc.lastAutoTable?.finalY || doc.autoTable?.previous?.finalY || 125;

      // Add Budget section
      if (previewData.budgets && Array.isArray(previewData.budgets) && previewData.budgets.length > 0) {
        currentY += 15;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Budget Breakdown', 20, currentY);

        const budgetData = previewData.budgets.map(budget => [
          budget.category,
          formatCurrency(budget.budgetAmount),
          formatDate(budget.createdAt)
        ]);

        tableFunction(doc, {
          head: [['Category', 'Budget Amount', 'Created']],
          body: budgetData,
          startY: currentY + 10,
          theme: 'striped',
          headStyles: { 
            fillColor: [52, 168, 83],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: { 
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 40, halign: 'right' },
            2: { cellWidth: 50 }
          }
        });

        currentY = doc.lastAutoTable?.finalY || currentY + 10;
      }

      // Add Planned Payments section
      if (previewData.plannedPayments && Array.isArray(previewData.plannedPayments) && previewData.plannedPayments.length > 0) {
        currentY += 15;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Planned Payments', 20, currentY);

        const plannedPaymentData = previewData.plannedPayments.map(payment => [
          payment.title,
          payment.category,
          `Day ${payment.dueDay}`,
          formatCurrency(payment.amount)
        ]);

        tableFunction(doc, {
          head: [['Title', 'Category', 'Due Day', 'Amount']],
          body: plannedPaymentData,
          startY: currentY + 10,
          theme: 'striped',
          headStyles: { 
            fillColor: [255, 152, 0],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: { 
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 40 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' }
          }
        });

        currentY = doc.lastAutoTable?.finalY || currentY + 10;
      }

        // Add category breakdown if there's space and we're not too far down the page
        const finalY = currentY;
        if (finalY < 220) { // If there's enough space
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Category Breakdown', 20, finalY + 20);

        const categoryData = Object.values(categoryBreakdown).map(item => [
          item.type.charAt(0).toUpperCase() + item.type.slice(1),
          item.category,
          item.count.toString(),
          formatCurrency(item.total)
        ]);

        tableFunction(doc, {
          head: [['Type', 'Category', 'Count', 'Total']],
          body: categoryData,
          startY: finalY + 30,
          theme: 'striped',
          headStyles: { 
            fillColor: [92, 184, 92],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
          },
          bodyStyles: { 
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 50 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' }
          }
        });
      }
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text('No transactions found for this month.', 20, 125);
    }

      // Save the PDF
      const methodSuffix = useAlternativeMethod ? '-Dynamic' : '';
      const fileName = `Financial-Report-${monthYear.replace(' ', '-')}-${user?.name?.replace(' ', '-') || 'User'}${methodSuffix}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      const methodName = useAlternativeMethod ? 'dynamic import method' : 'standard method';
      const suggestion = useAlternativeMethod 
        ? 'Try switching to the standard method above.'
        : 'Try switching to the dynamic import method above.';
      setError(`Failed to generate PDF using ${methodName}: ${error.message}. ${suggestion}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Export Financial Report</h2>
            <p className="text-gray-600">Generate and download PDF reports for your transactions</p>
          </div>
        </div>

        {/* Settings and Month Selection */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Report Settings</h3>
          
          {/* Export Method Selection */}
          <div className="mb-4 p-3 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">Export Method</h4>
                <p className="text-sm text-gray-600">
                  {useAlternativeMethod 
                    ? 'Dynamic Import Method - Better compatibility with some browsers'
                    : 'Standard Method - Faster loading, recommended for most users'
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useAlternativeMethod}
                  onChange={(e) => {
                    setUseAlternativeMethod(e.target.checked);
                    setError(''); // Clear any previous errors
                    if (!e.target.checked) {
                      setDynamicLibrariesLoaded(false); // Reset when switching back
                      setDynamicLibraries(null); // Clear dynamic libraries
                    }
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {useAlternativeMethod ? 'Dynamic' : 'Standard'}
                </span>
              </label>
            </div>
            {useAlternativeMethod && (!dynamicLibrariesLoaded || !dynamicLibraries) && (
              <div className="mt-2 text-sm text-orange-600">
                ⏳ Loading alternative method libraries...
              </div>
            )}
          </div>

          {/* Month Selection */}
          <div className="flex items-center space-x-4">
            <MonthFilter
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
              variant="native"
              label="Report Month"
              showReturnButton={false}
            />
            <button
              onClick={generatePDF}
              disabled={loading || !previewData || generatingPDF || (useAlternativeMethod && (!dynamicLibrariesLoaded || !dynamicLibraries))}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                loading || !previewData || generatingPDF || (useAlternativeMethod && (!dynamicLibrariesLoaded || !dynamicLibraries))
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Loading...' : generatingPDF ? 'Generating PDF...' : 'Generate PDF Report'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}



        {/* Preview Section */}
        {previewData && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Report Preview</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                useAlternativeMethod 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {useAlternativeMethod ? 'Dynamic Method' : 'Standard Method'}
              </span>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg text-center border">
                <h4 className="text-green-800 font-medium mb-2">Total Income</h4>
                <p className="text-xl font-bold text-green-900">
                  {formatCurrency(previewData.summary?.totalIncome || 0)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center border">
                <h4 className="text-red-800 font-medium mb-2">Total Expenses</h4>
                <p className="text-xl font-bold text-red-900">
                  {formatCurrency(previewData.summary?.totalExpense || 0)}
                </p>
              </div>
              <div className={`p-4 rounded-lg text-center border ${
                (previewData.summary?.balance || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  (previewData.summary?.balance || 0) >= 0 ? 'text-blue-800' : 'text-orange-800'
                }`}>
                  Net Balance
                </h4>
                <p className={`text-xl font-bold ${
                  (previewData.summary?.balance || 0) >= 0 ? 'text-blue-900' : 'text-orange-900'
                }`}>
                  {formatCurrency(previewData.summary?.balance || 0)}
                </p>
              </div>
            </div>

            {/* Data Overview */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded border">
                <p className="text-gray-700">
                  <span className="font-bold text-lg text-blue-600">{previewData.transactions?.length || 0}</span>
                </p>
                <p className="text-sm text-gray-600">Transactions</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <p className="text-gray-700">
                  <span className="font-bold text-lg text-green-600">{previewData.budgets?.length || 0}</span>
                </p>
                <p className="text-sm text-gray-600">Budget Items</p>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <p className="text-gray-700">
                  <span className="font-bold text-lg text-orange-600">{previewData.plannedPayments?.length || 0}</span>
                </p>
                <p className="text-sm text-gray-600">Planned Payments</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                This report will include comprehensive financial data: transactions, budgets, planned payments, and category breakdowns.
              </p>
            </div>

            {/* Recent Transactions Preview */}
            {previewData.transactions && previewData.transactions.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">
                  Recent Transactions Preview (showing first 5)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2 px-2">Date</th>
                        <th className="text-left py-2 px-2">Type</th>
                        <th className="text-left py-2 px-2">Description</th>
                        <th className="text-left py-2 px-2">Category</th>
                        <th className="text-right py-2 px-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.transactions.slice(0, 5).map((transaction, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-2">{formatDate(transaction.createdAt)}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              transaction.type === 'income' 
                                ? 'bg-green-200 text-green-800' 
                                : 'bg-red-200 text-red-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="py-2 px-2">{transaction.description}</td>
                          <td className="py-2 px-2">{transaction.category}</td>
                          <td className={`py-2 px-2 text-right font-medium ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.transactions.length > 5 && (
                    <p className="text-sm text-gray-600 mt-2">
                      ... and {previewData.transactions.length - 5} more transactions will be included in the PDF.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Budgets Preview */}
            {previewData.budgets && previewData.budgets.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Budget Breakdown ({previewData.budgets.length} categories)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {previewData.budgets.map((budget, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-800">{budget.category}</span>
                        <span className="font-bold text-green-900">{formatCurrency(budget.budgetAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Planned Payments Preview */}
            {previewData.plannedPayments && previewData.plannedPayments.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Planned Payments ({previewData.plannedPayments.length} payments)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {previewData.plannedPayments.map((payment, index) => (
                    <div key={index} className="p-3 bg-orange-50 rounded border border-orange-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-orange-800 block">{payment.title}</span>
                          <span className="text-sm text-orange-600">{payment.category} • Due Day {payment.dueDay}</span>
                        </div>
                        <span className="font-bold text-orange-900">{formatCurrency(payment.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewData.transactions && previewData.transactions.length === 0 && 
             (!previewData.budgets || previewData.budgets.length === 0) &&
             (!previewData.plannedPayments || previewData.plannedPayments.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No financial data found for the selected month.</p>
                <p className="text-sm text-gray-400 mt-1">The PDF will show an empty report with summary totals.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReportExport; 