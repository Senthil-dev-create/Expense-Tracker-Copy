// Local Storage Key
const EXPENSES_KEY = 'expenseTrackerData';

// Navigation Function
function navigateTo(pageId) {
    const pages = ['landingPage', 'addExpense', 'summary', 'search', 'delete', 'copy'];
    pages.forEach(page => {
        document.getElementById(page).classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');

    // Reset messages when navigating
    clearMessages();
}

// Clear messages across different sections
function clearMessages() {
    const messageElements = [
        'addMessage', 
        'deleteMessage', 
        'copyMessage', 
        'searchCount'
    ];
    messageElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.style.color = '';
        }
    });
}

// Expense Management Functions
function getExpenses() {
    try {
        const expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
        return expenses;
    } catch (error) {
        console.error('Error retrieving expenses:', error);
        return [];
    }
}

function saveExpenses(expenses) {
    try {
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    } catch (error) {
        console.error('Error saving expenses:', error);
        alert('Unable to save expenses. Storage might be full.');
    }
}

function addExpense() {
    const date = document.getElementById('expenseDate').value;
    const amount = document.getElementById('expenseAmount').value;
    const description = document.getElementById('expenseDescription').value;

    if (!date || !amount || !description) {
        showMessage('addMessage', 'Please fill all fields', 'red');
        return;
    }

    const expenses = getExpenses();
    const newExpense = {
        id: Date.now(), // Add unique identifier
        date,
        amount: parseFloat(amount),
        description: description.toUpperCase().trim()
    };

    expenses.unshift(newExpense);

    saveExpenses(expenses);

    // Clear input fields
    ['expenseDate', 'expenseAmount', 'expenseDescription'].forEach(id => {
        document.getElementById(id).value = '';
    });

    showMessage('addMessage', 'Expense Added Successfully!', 'green');
}

function showMessage(elementId, message, color) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.style.color = color;
    
    if (message) {
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.style.color = '';
        }, 3000);
    }
}

function displaySummary(page = 1) {
    const expenses = getExpenses();
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageExpenses = expenses.slice(startIndex, endIndex);

    const summaryTable = document.getElementById('summaryTable');
    const summaryPagination = document.getElementById('summaryPagination');

    // Enhanced table rendering with more flexibility
    summaryTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${pageExpenses.length > 0 
                    ? pageExpenses.map(expense => `
                        <tr>
                            <td>${expense.date}</td>
                            <td>₹${expense.amount.toFixed(2)}</td>
                            <td>${expense.description}</td>
                        </tr>
                    `).join('')
                    : `<tr><td colspan="3">No expenses found</td></tr>`
                }
            </tbody>
        </table>
    `;

    const totalPages = Math.ceil(expenses.length / itemsPerPage);
    summaryPagination.innerHTML = totalPages > 1 
        ? Array.from({length: totalPages}, (_, i) => 
            `<button onclick="displaySummary(${i + 1})">${i + 1}</button>`
        ).join('')
        : '';
}

function searchExpenses() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const expenses = getExpenses();
    
    const searchResults = expenses.filter(expense => 
        expense.date.toLowerCase().includes(searchTerm) ||
        expense.description.toLowerCase().includes(searchTerm)
    );

    const resultsDiv = document.getElementById('searchResults');
    const countDiv = document.getElementById('searchCount');

    resultsDiv.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${searchResults.length > 0
                    ? searchResults.map(expense => `
                        <tr>
                            <td>${expense.date}</td>
                            <td>₹${expense.amount.toFixed(2)}</td>
                            <td>${expense.description}</td>
                        </tr>
                    `).join('')
                    : `<tr><td colspan="3">No matching expenses found</td></tr>`
                }
            </tbody>
        </table>
    `;

    showMessage('searchCount', `Total Records: ${searchResults.length}`, 'black');
}

function searchExpensesToDelete() {
    const deleteDate = document.getElementById('deleteDate').value;
    const expenses = getExpenses();
    
    const searchResults = expenses.filter(expense => 
        expense.date === deleteDate
    );

    const deleteForm = document.getElementById('deleteForm');
    deleteForm.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Select</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${searchResults.length > 0
                    ? searchResults.map((expense, index) => `
                        <tr>
                            <td><input type="checkbox" name="deleteExpense" value="${index}"></td>
                            <td>${expense.date}</td>
                            <td>₹${expense.amount.toFixed(2)}</td>
                            <td>${expense.description}</td>
                        </tr>
                    `).join('')
                    : `<tr><td colspan="4">No expenses found for this date</td></tr>`
                }
            </tbody>
        </table>
    `;
}

function deleteSelectedExpenses() {
    const checkedBoxes = document.querySelectorAll('input[name="deleteExpense"]:checked');
    const expenses = getExpenses();
    
    const indicesToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
    
    const remainingExpenses = expenses.filter((_, index) => !indicesToDelete.includes(index));
    
    saveExpenses(remainingExpenses);
    
    showMessage('deleteMessage', `${indicesToDelete.length} expense(s) deleted successfully!`, 'green');
    
    // Refresh delete search results
    searchExpensesToDelete();
}

function filterAndPrepareForCopy() {
    const fromDate = document.getElementById('copyFromDate').value;
    const toDate = document.getElementById('copyToDate').value;
    const expenses = getExpenses();
    
    const filteredExpenses = expenses.filter(expense => 
        expense.date >= fromDate && expense.date <= toDate
    );

    const copyTable = document.getElementById('copyTable');
    const copyButton = document.getElementById('copyButton');

    if (filteredExpenses.length === 0) {
        copyTable.innerHTML = '';
        copyButton.style.display = 'none';
        showMessage('copyMessage', 'No data found', 'red');
        return;
    }

    copyTable.innerHTML = `
        <table id="tableToCopy">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                ${filteredExpenses.map(expense => `
                    <tr>
                        <td>${expense.date}</td>
                        <td>₹${expense.amount.toFixed(2)}</td>
                        <td>${expense.description}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    copyButton.style.display = 'block';
    document.getElementById('copyMessage').textContent = '';
}

function copyTableToClipboard() {
    const table = document.getElementById('tableToCopy');
    const rows = table.querySelectorAll('tr');
    
    let clipboardText = '';
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        clipboardText += Array.from(cells).map(cell => cell.textContent).join('\t') + '\n';
    });

    navigator.clipboard.writeText(clipboardText).then(() => {
        showMessage('copyMessage', 'Expense copied', 'green');
    }).catch(err => {
        console.error('Copy failed:', err);
        showMessage('copyMessage', 'Copy failed', 'red');
    });
}

// Event Listeners for Page Load
document.addEventListener('DOMContentLoaded', () => {
    // Initial page setup
    navigateTo('landingPage');

    // Setup event to display summary when summary page is opened
    document.getElementById('summary').addEventListener('click', () => {
        displaySummary();
    });
});