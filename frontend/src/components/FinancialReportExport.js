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
        axios.get('/api/budgets/with-spending', { params: { month, limit: 1000 } }), // Get budgets with spending calculations
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

  const getOrdinalSuffix = (day) => {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
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
    
    // Professional Header Design
    // Company/Title Header
    doc.setFillColor(218, 165, 32); // Gold color
    doc.rect(0, 0, 210, 12, 'F'); // Gold header bar
    
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DuitKu Financial Management', 105, 8, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Main Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL STATEMENT', 105, 25, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100); // Gray
    doc.text('Personal Account Summary', 105, 32, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Account Information Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Left side - Account details
    doc.text('ACCOUNT HOLDER:', 20, 45);
    doc.setFont('helvetica', 'bold');
    doc.text(user?.name || 'N/A', 20, 52);
    
    doc.setFont('helvetica', 'normal');
    doc.text('STATEMENT PERIOD:', 20, 62);
    doc.setFont('helvetica', 'bold');
    doc.text(monthYear, 20, 69);
    
    // Right side - Statement details
    doc.setFont('helvetica', 'normal');
    doc.text('STATEMENT DATE:', 130, 45);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), 130, 52);
    
    doc.setFont('helvetica', 'normal');
    doc.text('CURRENCY:', 130, 62);
    doc.setFont('helvetica', 'bold');
    doc.text('MYR', 130, 69);
    
    // Subtle divider line
    doc.setDrawColor(218, 165, 32); // Gold
    doc.setLineWidth(0.5);
    doc.line(20, 76, 190, 76);

    // Account Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(218, 165, 32); // Gold
    doc.text('ACCOUNT SUMMARY', 20, 88);
    doc.setTextColor(0, 0, 0); // Reset to black
    
    // Summary table-like layout
    const summaryY = 98;
    const lineHeight = 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Income section
    doc.text('Total Income', 25, summaryY);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(previewData.summary?.totalIncome || 0), 165, summaryY, { align: 'right' });
    
    // Expenses section
    doc.setFont('helvetica', 'normal');
    doc.text('Total Expenses', 25, summaryY + lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(previewData.summary?.totalExpense || 0), 165, summaryY + lineHeight, { align: 'right' });
    
    // Budget section
    doc.setFont('helvetica', 'normal');
    doc.text('Total Budget Allocated', 25, summaryY + (lineHeight * 2));
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(previewData.budgetSummary?.totalBudgetAmount || 0), 165, summaryY + (lineHeight * 2), { align: 'right' });
    
    // Planned Payments section
    doc.setFont('helvetica', 'normal');
    doc.text('Planned Payments', 25, summaryY + (lineHeight * 3));
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(previewData.plannedPaymentSummary?.totalAmount || 0), 165, summaryY + (lineHeight * 3), { align: 'right' });
    
    // Subtle divider before net balance
    doc.setDrawColor(200, 200, 200); // Light gray
    doc.setLineWidth(0.3);
    doc.line(25, summaryY + (lineHeight * 3.8), 165, summaryY + (lineHeight * 3.8));
    
    // Net Balance - highlighted
    const balance = previewData.summary?.balance || 0;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('NET BALANCE', 25, summaryY + (lineHeight * 4.8));
    
    // Set color based on balance (green for positive, red for negative)
    if (balance >= 0) {
      doc.setTextColor(34, 139, 34); // Forest green
    } else {
      doc.setTextColor(220, 20, 60); // Crimson red
    }
    doc.text(formatCurrency(balance), 165, summaryY + (lineHeight * 4.8), { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
    
    // Transaction History Section
    if (previewData.transactions.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(218, 165, 32); // Gold
      doc.text('TRANSACTION HISTORY', 20, 153);
      doc.setTextColor(0, 0, 0); // Reset to black

      // Prepare data for table with single amount column
      const tableData = previewData.transactions.map(transaction => [
        formatDate(transaction.createdAt),
        transaction.description,
        transaction.category,
        formatCurrency(transaction.amount)
      ]);

      // Professional table styling
      tableFunction(doc, {
        head: [['DATE', 'DESCRIPTION', 'CATEGORY', 'AMOUNT']],
        body: tableData,
        startY: 163,
        theme: 'plain',
        headStyles: { 
          fillColor: [248, 248, 248], // Very light gray
          textColor: [0, 0, 0], // Black text
          fontSize: 9,
          fontStyle: 'bold',
          cellPadding: 4,
          lineColor: [218, 165, 32], // Gold border
          lineWidth: 0.5
        },
        bodyStyles: { 
          fontSize: 8,
          cellPadding: 3,
          lineColor: [230, 230, 230], // Light gray borders
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 30, fontSize: 8 }, // Date
          1: { cellWidth: 65, fontSize: 8 }, // Description
          2: { cellWidth: 35, fontSize: 8 }, // Category
          3: { cellWidth: 30, halign: 'right', fontSize: 8 } // Amount
        },
        margin: { left: 20, right: 20 },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3,
          fontSize: 8,
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252] // Very subtle alternate row color
        },
        didParseCell: function(data) {
          // Color code the amount column based on transaction type
          if (data.column.index === 3) { // Amount column
            const rowIndex = data.row.index;
            const transaction = previewData.transactions[rowIndex];
            if (transaction) {
              if (transaction.type === 'income') {
                data.cell.styles.textColor = [34, 139, 34]; // Green for income
              } else {
                data.cell.styles.textColor = [220, 20, 60]; // Red for expense
              }
            }
          }
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

      // Budget Analysis Section - New Page
      if (previewData.budgets && Array.isArray(previewData.budgets) && previewData.budgets.length > 0) {
        doc.addPage();
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(218, 165, 32); // Gold
        doc.text('BUDGET ANALYSIS', 20, 30);
        doc.setTextColor(0, 0, 0); // Reset to black

        const budgetData = previewData.budgets.map(budget => {
          const remaining = budget.remainingBalance || budget.budgetAmount;
          return [
            budget.category,
            formatCurrency(budget.budgetAmount),
            formatCurrency(budget.spent || 0),
            formatCurrency(remaining),
            remaining >= 0 ? 'On Track' : 'Over Budget'
          ];
        });

        tableFunction(doc, {
          head: [['CATEGORY', 'ALLOCATED', 'SPENT', 'REMAINING', 'STATUS']],
          body: budgetData,
          startY: 40,
          theme: 'plain',
          headStyles: { 
            fillColor: [248, 248, 248], // Very light gray
            textColor: [0, 0, 0], // Black text
            fontSize: 9,
            fontStyle: 'bold',
            cellPadding: 4,
            lineColor: [218, 165, 32], // Gold border
            lineWidth: 0.5
          },
          bodyStyles: { 
            fontSize: 8,
            cellPadding: 3,
            lineColor: [230, 230, 230], // Light gray borders
            lineWidth: 0.2
          },
          columnStyles: {
            0: { cellWidth: 40, fontSize: 8 }, // Category
            1: { cellWidth: 30, halign: 'right', fontSize: 8 }, // Allocated
            2: { cellWidth: 30, halign: 'right', fontSize: 8 }, // Spent
            3: { cellWidth: 30, halign: 'right', fontSize: 8 }, // Remaining
            4: { cellWidth: 20, halign: 'center', fontSize: 8 } // Status
          },
          margin: { left: 20, right: 20 },
          styles: {
            overflow: 'linebreak',
            cellPadding: 3,
            fontSize: 8,
            valign: 'middle'
          },
          alternateRowStyles: {
            fillColor: [252, 252, 252] // Very subtle alternate row color
          },
          didParseCell: function(data) {
            // Color code the status column
            if (data.column.index === 4) { // Status column
              if (data.cell.text[0] === 'Over Budget') {
                data.cell.styles.textColor = [220, 20, 60]; // Red
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [34, 139, 34]; // Green
              }
            }
            // Color code remaining balance
            if (data.column.index === 3) { // Remaining column
              const remaining = parseFloat(data.cell.text[0].replace(/[^0-9.-]+/g, ""));
              if (remaining < 0) {
                data.cell.styles.textColor = [220, 20, 60]; // Red for negative
              }
            }
          }
        });
      }

      // Planned Payments Section - New Page
      if (previewData.plannedPayments && Array.isArray(previewData.plannedPayments) && previewData.plannedPayments.length > 0) {
        doc.addPage();
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(218, 165, 32); // Gold
        doc.text('PLANNED PAYMENTS', 20, 30);
        doc.setTextColor(0, 0, 0); // Reset to black

        const plannedPaymentData = previewData.plannedPayments.map(payment => [
          payment.title,
          payment.category,
          `${payment.dueDay}${getOrdinalSuffix(payment.dueDay)}`,
          formatCurrency(payment.amount),
          payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Pending'
        ]);

        tableFunction(doc, {
          head: [['PAYEE', 'CATEGORY', 'DUE DATE', 'AMOUNT', 'STATUS']],
          body: plannedPaymentData,
          startY: 40,
          theme: 'plain',
          headStyles: { 
            fillColor: [248, 248, 248], // Very light gray
            textColor: [0, 0, 0], // Black text
            fontSize: 9,
            fontStyle: 'bold',
            cellPadding: 4,
            lineColor: [218, 165, 32], // Gold border
            lineWidth: 0.5
          },
          bodyStyles: { 
            fontSize: 8,
            cellPadding: 3,
            lineColor: [230, 230, 230], // Light gray borders
            lineWidth: 0.2
          },
          columnStyles: {
            0: { cellWidth: 40, fontSize: 8 }, // Payee
            1: { cellWidth: 30, fontSize: 8 }, // Category
            2: { cellWidth: 20, halign: 'center', fontSize: 8 }, // Due Date
            3: { cellWidth: 25, halign: 'right', fontSize: 8 }, // Amount
            4: { cellWidth: 25, halign: 'center', fontSize: 8 } // Status
          },
          margin: { left: 20, right: 20 },
          styles: {
            overflow: 'linebreak',
            cellPadding: 3,
            fontSize: 8,
            valign: 'middle'
          },
          alternateRowStyles: {
            fillColor: [252, 252, 252] // Very subtle alternate row color
          },
          didParseCell: function(data) {
            // Color code the status column
            if (data.column.index === 4) { // Status column
              const status = data.cell.text[0].toLowerCase();
              if (status === 'overdue') {
                data.cell.styles.textColor = [220, 20, 60]; // Red
                data.cell.styles.fontStyle = 'bold';
              } else if (status === 'settled') {
                data.cell.styles.textColor = [34, 139, 34]; // Green
              } else {
                data.cell.styles.textColor = [218, 165, 32]; // Gold for pending
              }
            }
          }
        });
      }

        // Category Summary - New Page
        if (Object.keys(categoryBreakdown).length > 0) {
        doc.addPage();
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(218, 165, 32); // Gold
        doc.text('CATEGORY SUMMARY', 20, 30);
        doc.setTextColor(0, 0, 0); // Reset to black

        const categoryData = Object.values(categoryBreakdown).map(item => [
          item.type.charAt(0).toUpperCase() + item.type.slice(1),
          item.category,
          item.count.toString(),
          formatCurrency(item.total)
        ]);

        tableFunction(doc, {
          head: [['TYPE', 'CATEGORY', 'COUNT', 'TOTAL']],
          body: categoryData,
          startY: 40,
          theme: 'plain',
          headStyles: { 
            fillColor: [248, 248, 248], // Very light gray
            textColor: [0, 0, 0], // Black text
            fontSize: 9,
            fontStyle: 'bold',
            cellPadding: 4,
            lineColor: [218, 165, 32], // Gold border
            lineWidth: 0.5
          },
          bodyStyles: { 
            fontSize: 8,
            cellPadding: 3,
            lineColor: [230, 230, 230], // Light gray borders
            lineWidth: 0.2
          },
          columnStyles: {
            0: { cellWidth: 25, fontSize: 8, halign: 'center' }, // Type
            1: { cellWidth: 50, fontSize: 8 }, // Category
            2: { cellWidth: 20, halign: 'center', fontSize: 8 }, // Count
            3: { cellWidth: 35, halign: 'right', fontSize: 8 } // Total
          },
          margin: { left: 20, right: 20 },
          styles: {
            overflow: 'linebreak',
            cellPadding: 3,
            fontSize: 8,
            valign: 'middle'
          },
          alternateRowStyles: {
            fillColor: [252, 252, 252] // Very subtle alternate row color
          },
          didParseCell: function(data) {
            // Color code based on type
            if (data.column.index === 0) { // Type column
              if (data.cell.text[0] === 'Income') {
                data.cell.styles.textColor = [34, 139, 34]; // Green
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [220, 20, 60]; // Red
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });
      }
    } else {
      // No transactions message - professional styling
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100); // Gray
      doc.text('No transaction activity recorded for this period.', 105, 180, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset to black
    }

      // Professional Footer
      const pageHeight = 297; // A4 height in mm
      const footerY = pageHeight - 25;
      
      // Footer divider line
      doc.setDrawColor(218, 165, 32); // Gold
      doc.setLineWidth(0.5);
      doc.line(20, footerY - 5, 190, footerY - 5);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100); // Gray
      
      // Left side - Confidentiality notice
      doc.text('CONFIDENTIAL: This statement is for the account holder only.', 20, footerY);
      doc.text('Please review and report any discrepancies immediately.', 20, footerY + 5);
      
      // Right side - Contact info
      doc.text('DuitKu Financial Management App', 190, footerY, { align: 'right' });
      
      // Center - Page info
      doc.setFont('helvetica', 'italic');
      doc.text('*** END OF STATEMENT ***', 105, footerY + 12, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Save the PDF with professional naming
      const methodSuffix = useAlternativeMethod ? '-Dynamic' : '';
      const fileName = `DUITKU-Statement-${monthYear.replace(' ', '-')}-${user?.name?.replace(/\s+/g, '-') || 'Account'}${methodSuffix}.pdf`;
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
                This report includes your comprehensive financial data: transactions, budgets, planned payments, and category breakdowns.
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
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-green-800 block">{budget.category}</span>
                          <div className="text-sm text-green-600 mt-1">
                            <div>Spent: {formatCurrency(budget.spent || 0)}</div>
                            <div className={`${budget.remainingBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                              Remaining: {formatCurrency(budget.remainingBalance || budget.budgetAmount)}
                            </div>
                          </div>
                        </div>
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
                          {payment.status && (
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                              payment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              payment.status === 'settled' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          )}
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