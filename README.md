# QUESTIONNAIRE tool

This tool is the fancy submit form for the incoming requests collection for the internal purposes.
The ides is very simple - to answer question one-by-one.
After providing all the answers the summary modal appears, with option to submit data to database.

![questionnaire-day](./questionnaire-day.jpg)

![questionnaire-day-modal](./questionnaire-day-modal.jpg)

![chart](./chart.jpg)

Night-mode available:

![questionnaire-night](./questionnaire-night.jpg)

This code is presented for demonstrational purposes and does not include any confidential information.

The project has been separated into two classes - for the form itself ([_/static/script.js_](https://github.com/lukmrv/questionnaire-tool/blob/master/static/script.js)) as well as for the chart ([_/static/stats/charts.js_](https://github.com/lukmrv/questionnaire-tool/blob/master/static/stats/charts.js)). Chart reaches for all the collected data from the database.
