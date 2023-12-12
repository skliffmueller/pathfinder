

const regexMatch = /(\#[a-z])(?:\{([^}]+)\})?/g;
const defaultDateFormat = "YYYY-MM-DD_hhmmss";
export class StringFormat {
    static parse(str: string) {
        return str.replace(regexMatch, (match, select, options) => {
            switch(select) {
                case "#u": // Unix Seconds Timestamp
                    return `${Math.floor(Date.now() / 1000)}`;
                case "#d": // Date
                    return options
                        ? StringFormat.formatDate(options)
                        : StringFormat.formatDate(defaultDateFormat);
            }
            return match;
        });
    }
    static formatDate(dateString: string) {
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = date.getMonth().toFixed(2);
        const day = date.getDate().toFixed(2);
        const hour = date.getHours().toFixed(2);
        const minute = date.getMinutes().toFixed(2);
        const second = date.getSeconds().toFixed(2);

        dateString = dateString.replace("YYYY", year);
        dateString = dateString.replace("MM", month);
        dateString = dateString.replace("DD", day);
        dateString = dateString.replace("hh", hour);
        dateString = dateString.replace("mm", minute);
        dateString = dateString.replace("ss", second);

        return dateString;
    }
}