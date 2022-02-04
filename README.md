# Investify

I've built this app aimed to compute and manifest summary statistics about weekly price fluctuations of any stock (time window can also be bi-weekly, daily, or of any frequency). The instructions below provide a comprehensive account of all statistics and data this app provides, but the most important ones are:
- percentiles of the weekly relative change in stock price
- stock price fluctuations weeks before and after key events such as earnings release and stock splits

These statistics can be useful for determining the strike price in options trading alongside the *Greeks*.

## Configuration Panel

**Stock code:** Ticker symbol of a stock for enquiry. Enter the stock code before hitting the "Go" or "Update" button.

**Go:** When hitting this button, the server will attempt to access the stock data from a backend database. If data of the stock are not available from the database, it will be fetched externally from Yahoo Finance. This measure is to reduce redundant calls to the external source.

**Update:** When hitting this button, the most up-to-date stock data will be fetched from Yahoo Finance, that will be sent to both the client and the backend database.

**Starting weekday:** The start day of each period in computing the relative change in the stock price. Default is the market open stock price on each Friday.

**Duration:** The length of the period for computing the relative change. Default value is 7 (days), with the time point taken at market close.

**Analysis period:** A timeframe for computing the statistics of historical stock prices. Default value is unspecified, meaning that the entire stock price history will be used.

**Event filter:** Must be one out of the following: None (default), Earnings Release, Ex-dividend Dates, Stock Splits, and Custom Dates. Other than None, only periods with start dates falling into the selected special event dates will be considered. When Custom Dates is selected, filtering will be performed on the dates inputted in the text box underneath, once the Submit button is clicked. The format for entering custom dates are YYYY-MM-DD, one date per row.

**Threshold of % change:** Periods with a big relative change in the stock price exceeding a threshold will be shown on the right panel, underneath the summary statistics. The default setting (Below, -10) shows periods in which the stock price has dropped over 10%.

**Show # preceeding / trailing weeks:** An optional configuration to show the relative change weeks before or after the periods of interest. This is particularly useful if one wants to study the pattern of stock price movements 1-2 weeks before and after earnings release, for example. Default values are 0, meaning that data from preceding / trailing weeks are not shown.

## Output panel

**Delta Percentile:** Percentiles of the relative change; the median relative change is available from the column labelled 50%.

**Predicted Price:** Projected stock price by taking the relative change on the end date of the latest period.

**Date & Date+N:** Start and end dates of each period; N (days) is the Duration specified in the Configuration Panel.

**Delta:** Relative change of the stock price between the start and end dates of each period. As mentioned in the legend for the Configuration Panel, only periods with relative changes exceeding the threshold will be shown.
