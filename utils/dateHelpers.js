const calculateDates = (shelfLife, daysOld) => {
    const today = new Date();
    // purchaseDate = today - daysOld
    const purchaseDate = new Date(today);
    purchaseDate.setDate(today.getDate() - parseInt(daysOld));

    // expiryDate = purchaseDate + shelfLife
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(purchaseDate.getDate() + parseInt(shelfLife));

    return { purchaseDate, expiryDate };
};

const determineStatus = (expiryDate) => {
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return 'expired';
    } else if (diffDays <= 2) {
        return 'expiring';
    } else {
        return 'fresh';
    }
};

module.exports = {
    calculateDates,
    determineStatus
};
