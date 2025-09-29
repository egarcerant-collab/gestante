// @ts-nocheck
const excelData = {
    "2025": {
        "ENERO": [],
        "FEBRERO": [],
        "MARZO": [],
        "ABRIL": [],
        "MAYO": [],
        "JUNIO": [],
        "JULIO": [],
        "AGOSTO": []
    },
    "2026": {}
};

export const availableYears = Object.keys(excelData);

export function getAvailableMonthsForYear(year) {
    return excelData[year] ? Object.keys(excelData[year]) : [];
}

export function getExcelData(year, month) {
    try {
        return excelData[year][month];
    } catch (e) {
        console.error(`Could not get data for year ${year} and month ${month}`, e);
        return null;
    }
}
