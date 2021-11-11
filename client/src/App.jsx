import React, { Component } from 'react';
import { quantileSorted } from 'd3';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      start_weekday: 5,
      start_oc: 'open',
      n_days: 7,
      end_oc: 'close',
      date_range_from: '',
      date_range_to: '',
      event: 'None',
      custom_dates: [],
      eb: 'Below',
      threshold: -10,
      show_preceeding: 0,
      show_trailing: 0
    };

    this.compute_change = this.compute_change.bind(this);
    this.row_filter = this.row_filter.bind(this);
  }

  render() {
    // res_quantile
    let quantile_header;
    let quantile_row = [];
    let buffer_row = [];
    if (this.state.map) {
      let colNames = [0, 1, 2, 3, 4, 5, 10, 15, 20, 50, 80, 85, 90, 95, 96, 97, 98, 99, 100];
      quantile_header = colNames.map(col => <th className='quantile_header text-center'>{col}%</th>);
      quantile_header.unshift(<th></th>);

      const deltaArr = [];
      this.state.map.forEach(val => {
        if (val.show && typeof val.deltaF0 === 'number') deltaArr.push(val.deltaF0);
      });
      if (deltaArr.length > 0) {
        deltaArr.sort((a, b) => a - b);
        const quantiles = colNames.map(p => quantileSorted(deltaArr, p / 100));
        quantile_row = quantiles.map(q => <td className='text-center'>{q.toFixed(2)}</td>);
        quantile_row.unshift(<th className='text-center'>Delta Percentile</th>);

        const base = [...this.state.map][0][1][this.state.start_oc];
        console.log(`Base price (${[...this.state.map][0][0]}, ${this.state.start_oc}): ${base}`);
        if (typeof base === 'number' && base > 0) {
          const buffer = quantiles.map(q => base * (1 + q / 100));
          buffer_row = buffer.map(v => <td className='text-center'>{v.toFixed(2)}</td>);
          buffer_row.unshift(<th className='text-center'>Predicted Price</th>);
        }    
      }
    }

    // res_stat
    let stat_header;
    let stat_row = [];
    if (this.state.map) {
      let colNames = ['N', 'Avg Delta', 'Avg +ve Delta', '% w/ +ve Delta', 'Avg -ve Delta', '% w/ -ve Delta', `% ${this.state.eb === 'Exceed' ? 'Exceeding' : 'Below'} Threshold`];
      stat_header = colNames.map(col => <th className='stat_header text-center'>{col}</th>);

      const obj = {};
      colNames.forEach(col => obj[col] = 0);
      this.state.map.forEach(val => {
        if (val.show) {
          obj['N']++;
          if (typeof val.deltaF0 === 'number') {
            obj['Avg Delta'] += val.deltaF0;
            if (val.deltaF0 > 0) {
              obj['Avg +ve Delta'] += val.deltaF0;
              obj['% w/ +ve Delta']++;
            } else if (val.deltaF0 < 0) {
              obj['Avg -ve Delta'] += val.deltaF0;
              obj['% w/ -ve Delta']++;
            }
            if (val.passEb) obj[`% ${this.state.eb === 'Exceed' ? 'Exceeding' : 'Below'} Threshold`]++;
          }
        }
      });
      if (obj['N'] > 0) {
        if (obj['% w/ +ve Delta'] > 0) obj['Avg +ve Delta'] /= obj['% w/ +ve Delta'];
        if (obj['% w/ -ve Delta'] > 0) obj['Avg -ve Delta'] /= obj['% w/ -ve Delta'];
        obj['Avg Delta'] /= obj['N'];
        obj['% w/ +ve Delta'] /= obj['N'] / 100;
        obj['% w/ -ve Delta'] /= obj['N'] / 100;
        obj[`% ${this.state.eb === 'Exceed' ? 'Exceeding' : 'Below'} Threshold`] /= obj['N'] / 100;
        colNames.forEach(col => stat_row.push(<td className='text-center'>{obj[col].toFixed(col === 'N' ? 0 : 2)}</td>));
      }
    }

    // res_dat
    let dat_header;
    let dat_rows = [];
    if (this.state.map) {
      let colNames = ['date_adj', 'open', 'close', 'volume', 'date_adjF0', 'openF0', 'closeF0', 'volumeF0', 'deltaF0'];
      // let colNames = ['date_adj', 'adj', 'open', 'close', 'volume', 'date_adjF0', 'adjF0', 'openF0', 'closeF0', 'volumeF0', 'deltaF0'];
      if (this.state.show_preceeding > 0 || this.state.show_trailing > 0) {
        colNames = ['date_adj', 'open', 'close'];
        // colNames = ['date_adj', 'adj', 'open', 'close'];
        for (let i = this.state.show_preceeding; i > 0; i--) {
          colNames.push('deltaW-' + i);
        }
        colNames.push('deltaF0');
        for (let i = 1; i <= this.state.show_trailing; i++) {
          colNames.push('deltaW' + i);
        }
      }
      // rename a few columns
      const newColNames = {
        'date_adj': 'Date',
        'adj': 'Adj',
        'open': 'Open',
        'close': 'Close',
        'volume': 'Volume',
        'date_adjF0': `Date+${this.state.n_days}`,
        'adjF0': `Adj D+${this.state.n_days}`,
        'openF0': `Open D+${this.state.n_days}`,
        'closeF0': `Close D+${this.state.n_days}`,
        'volumeF0': `Volume D+${this.state.n_days}`,
        'deltaF0': 'Delta'
      }
      for (let i = 1; i <= this.state.show_preceeding; i++) newColNames[`deltaW-${i}`] = `Delta W-${i}`;
      for (let i = 1; i <= this.state.show_trailing; i++) newColNames[`deltaW${i}`] = `Delta W+${i}`;
      const colNames1 = colNames.map(col => newColNames[col]);
      dat_header = colNames1.map(col => <th className='dat_header text-center'>{col}</th>);

      for (const row of this.state.map.values()) {
        if (row.show && row.passEb) {
          dat_rows.push(<tr>{colNames.map(col => <td className='text-center'>{((typeof row[col] === 'number') ? row[col].toFixed(3) : (row[col] || ''))}</td>)}</tr>);
        }
      }
    }

    return(
      <div>
          {this.state.map && quantile_row.length > 0 &&
            <div id='res_quantile'>
              <table className='table table-striped'>
                <thead>
                  <tr>
                    {quantile_header}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {quantile_row}
                  </tr>
                  {buffer_row.length > 0 &&
                    <tr>
                      {buffer_row}
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          {this.state.map && stat_row.length > 0 &&
            <div id='res_prob'>
              <table className='table table-striped'>
                <thead>
                  <tr>
                    {stat_header}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {stat_row}
                  </tr>
                </tbody>
              </table>
            </div>
          }

          {this.state.map && dat_rows.length > 0 &&
            <div id='res_dat'>
              <table className='table table-striped'>
                <thead>
                  <tr>
                  {dat_header}
                  </tr>
                </thead>
                <tbody>
                  {dat_rows}
                </tbody>
              </table>
            </div>
          }
      </div>
    ); 
  }

  compute_change(map, start_oc, n_days, end_oc, show_preceeding, show_trailing) {
    for (const elem of map.entries()) {
      const dateArr = elem[0].split('-').map((elem, ind) => Number(elem) - (ind === 1 ? 1 : 0));
      const newDate = new Date(...dateArr);
      newDate.setDate(newDate.getDate() + n_days);
      const newDateStr = newDate.toISOString().slice(0, 10);
      const match = map.get(newDate.toISOString().slice(0, 10)) || {};
      elem[1].date_origF0 = match.date_orig;
      elem[1].date_adjF0 = match.date_adj;
      elem[1].adjF0 = match.adj;
      elem[1].openF0 = match.open;
      elem[1].closeF0 = match.close;
      elem[1].volumeF0 = match.volume;
      elem[1].deltaF0 = (elem[1][end_oc + 'F0'] - elem[1][start_oc]) / elem[1][start_oc] * 100;
      if (isNaN(elem[1].deltaF0)) elem[1].deltaF0 = undefined;

      if (show_trailing > 0) {
        for (let i = 1; i <= show_trailing; i++) {
          const newStartDate = new Date(elem[0]);
          newStartDate.setDate(newStartDate.getDate() + i * 7);
          const matchStart = map.get(newStartDate.toISOString().slice(0, 10)) || {};
          const newEndDate = new Date(newDateStr);
          newEndDate.setDate(newEndDate.getDate() + i * 7);
          const matchEnd = map.get(newEndDate.toISOString().slice(0, 10)) || {};
          elem[1]['deltaW' + i] = (matchEnd[end_oc] - matchStart[start_oc]) / matchStart[start_oc] * 100;
          if (isNaN(elem[1]['deltaW' + i])) elem[1]['deltaW' + i] = undefined; 
          elem[1]['deltaF' + i] = (matchEnd[end_oc] - elem[1][start_oc]) / elem[1][start_oc] * 100;
          if (isNaN(elem[1]['deltaF' + i])) elem[1]['deltaF' + i] = undefined;
        }
      }

      if (show_preceeding > 0) {
        for (let i = 1; i <= show_preceeding; i++) {
          const newStartDate = new Date(elem[0]);
          newStartDate.setDate(newStartDate.getDate() - i * 7);
          const matchStart = map.get(newStartDate.toISOString().slice(0, 10)) || {};
          const newEndDate = new Date(newDateStr);
          newEndDate.setDate(newEndDate.getDate() - i * 7);
          const matchEnd = map.get(newEndDate.toISOString().slice(0, 10)) || {};
          elem[1]['deltaW-' + i] = (matchEnd[end_oc] - matchStart[start_oc]) / matchStart[start_oc] * 100;
          if (isNaN(elem[1]['deltaW-' + i])) elem[1]['deltaW-' + i] = undefined;
          elem[1]['deltaP' + i] = (elem[1][end_oc + 'F0'] - matchStart[start_oc]) / matchStart[start_oc] * 100;
          if (isNaN(elem[1]['deltaP' + i])) elem[1]['deltaP' + i] = undefined;
        }
      }

      elem[1].show = ('show' in elem[1]) ? elem[1].show : true;
      elem[1].passEb = ('passEb' in elem[1]) ? elem[1].passEb : true;
    }
  }

  row_filter(map, date_range_from, date_range_to, event, custom_dates, start_weekday, eb, threshold) {
    for (const elem of map.entries()) {
      elem[1].show = true;
      if ((date_range_from !== '' && elem[0] < date_range_from) || (date_range_to !== '' && elem[0] > date_range_to)) elem[1].show = false;

      if (custom_dates.length > 0) {
        if (! custom_dates.includes(elem[0])) elem[1].show = false;
      } else if (event !== 'None' && event !== 'Custom dates') elem[1].show = false;

      if (start_weekday !== -1 && elem[1].weekday !== start_weekday) elem[1].show = false;

      elem[1].passEb = true;
      if (elem[1].deltaF0 === undefined) {
        elem[1].show = false;
      } else {
        if (eb === 'Exceed') {
          if (Number(elem[1].deltaF0) <= threshold) elem[1].passEb = false;
        } else {
          if (Number(elem[1].deltaF0) >= threshold) elem[1].passEb = false;
        }
      }
    }
  }

  componentDidMount() {
    document.getElementById('go').addEventListener('click', () => {
      const stock = document.getElementById('stock').value;
    
      fetch(`/getStock/${stock}`)
        .then(res => res.json())
        .then(data => {
          console.log(data[0]);
          const map = new Map(data.map(elem => [elem.date_orig, elem]));

          // compute % change
          this.compute_change(map, this.state.start_oc, this.state.n_days, this.state.end_oc, this.state.show_preceeding, this.state.show_trailing);

          // reset event and custom_dates state and the radio button of the event filter to default values, and filter data by date or by threshold
          const event = 'None';
          const custom_dates = [];    
          document.getElementsByName('event')[0].checked = true;
          this.row_filter(map, this.state.date_range_from, this.state.date_range_to, event, custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);

          // update state of React App to re-render;
          this.setState({ stock, map, event, custom_dates });
        });
    });

    document.getElementById('delete').addEventListener('click', () => {
      const stock = document.getElementById('stock').value;

      fetch(`/deleteStock/${stock}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          console.log(data);
        });
    });

    document.getElementById('update').addEventListener('click', () => {
      const stock = document.getElementById('stock').value;

      fetch(`/updateStock/${stock}`)
        .then(res => res.json())
        .then(data => {
          console.log(data[0]);
          const map = new Map(data.map(elem => [elem.date_orig, elem]));

          // compute % change
          this.compute_change(map, this.state.start_oc, this.state.n_days, this.state.end_oc, this.state.show_preceeding, this.state.show_trailing);

          // data filtering by date or by threshold
          this.row_filter(map, this.state.date_range_from, this.state.date_range_to, this.state.event, this.state.custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);

          // update state of React App to re-render;
          this.setState({ stock, map });
        });
    })
    
    const start_weekday_node = document.getElementById('start_weekday');
    start_weekday_node.addEventListener('change', (event) => {
      const start_weekday = Number(start_weekday_node.value);
      console.log('mounted and changed: ' + start_weekday);

      this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, this.state.event, this.state.custom_dates, start_weekday, this.state.eb, this.state.threshold);
      this.setState({ start_weekday, map: this.state.map });
      console.log('update ' + this.state.start_weekday);
      console.log(this.state.map);
    });

    const start_oc_nodelist = document.getElementsByName('start_oc');
    for (const node of start_oc_nodelist) {
      node.addEventListener('change', (event) => {
        if (node.checked) {
          const start_oc = node.value;
          console.log('mounted and changed: ' + start_oc);

          this.compute_change(this.state.map, start_oc, this.state.n_days, this.state.end_oc, this.state.show_preceeding, this.state.show_trailing);
          this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, this.state.event, this.state.custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);
          this.setState({ start_oc, map: this.state.map });
          console.log('update ' + this.state.start_oc);
        }
      });
    }

    const n_days_node = document.getElementById('n_days');
    n_days_node.addEventListener('change', (event) => {
      const n_days = Number(n_days_node.value) || 0;
      if (n_days > 0) {
        console.log('mounted and changed: ' + n_days);

        this.compute_change(this.state.map, this.state.start_oc, n_days, this.state.end_oc, this.state.show_preceeding, this.state.show_trailing);
        this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, this.state.event, this.state.custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);
        this.setState({ n_days, map: this.state.map });
        console.log('update ' + this.state.n_days);
      }
    });

    const end_oc_nodelist = document.getElementsByName('end_oc');
    for (const node of end_oc_nodelist) {
      node.addEventListener('change', (event) => {
        if (node.checked) {
          const end_oc = node.value;
          console.log('mounted and changed: ' + end_oc);

          this.compute_change(this.state.map, this.state.start_oc, this.state.n_days, end_oc, this.state.show_preceeding, this.state.show_trailing);
          this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, this.state.event, this.state.custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);
          this.setState({ end_oc, map: this.state.map });
          console.log('update ' + this.state.end_oc);
        }
      });
    }

    // // onchange event listener from vanilla JS doesn't work on date picker
    // const date_range_from_node = document.getElementById('date_range_from');
    // date_range_from_node.addEventListener('change', (event) => {
    //   const date_range_from = date_range_from_node.value;
    //   if (date_range_from.length === 10 && !!(new Date(date_range_from) | 0)) {
    //     console.log('mounted and changed: ' + date_range_from);
    //     this.setState({ date_range_from });
    //     console.log('update ' + this.state.date_range_from);
    //   }
    // });

    const appThis = this;

    // $("#date_range_from").datepicker({
    //   onSelect: function() {
    //     $(this).change();
    //   }
    // });

    $('#date_range_from').on('change', function() {
      const date_range_from = this.value;
      if (date_range_from === '' || (date_range_from.length === 10 && !!(new Date(date_range_from) | 0))) {
        console.log('mounted and changed: ' + date_range_from);

        appThis.row_filter(appThis.state.map, date_range_from, appThis.state.date_range_to, appThis.state.event, appThis.state.custom_dates, appThis.state.start_weekday, appThis.state.eb, appThis.state.threshold);
        appThis.setState({ date_range_from, map: appThis.state.map });
        console.log('update ' + appThis.state.date_range_from);
      }
    });

    $('#date_range_to').on('change', function() {
      const date_range_to = this.value;
      if (date_range_to === '' || (date_range_to.length === 10 && !!(new Date(date_range_to) | 0))) {
        console.log('mounted and changed: ' + date_range_to);

        appThis.row_filter(appThis.state.map, appThis.state.date_range_from, date_range_to, appThis.state.event, appThis.state.custom_dates, appThis.state.start_weekday, appThis.state.eb, appThis.state.threshold);
        appThis.setState({ date_range_to, map: appThis.state.map });
        console.log('update ' + appThis.state.date_range_to);
      }
    });

    const event_nodelist = document.getElementsByName('event');
    for (const node of event_nodelist) {
      node.addEventListener('change', (e) => {
        if (node.checked) {
          const event = node.value;
          console.log('mounted and changed: ' + event);

          if (event === 'None') {
            const custom_dates = [];

            // data filtering by date or by threshold
            this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, event, custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);
      
            // update state of React App to re-render;
            this.setState({ event, custom_dates, map: this.state.map });
            console.log('update ' + this.state.event);
            console.log(this.state.custom_dates);    
          }

          if (event === 'Earnings') {
            fetch(`/getEarnings/${this.state.stock}`)
              .then(res => res.json())
              .then(html => {
                const doc = document.createElement('html');
                doc.innerHTML = html;
                const table = doc.getElementsByTagName('tbody')[0];
                console.log(table.getElementsByTagName('tr')[0].childNodes[2].getElementsByTagName('span')[0].innerHTML);
                const custom_dates = [];
                for (const row of table.getElementsByTagName('tr')) {
                  const date = row.childNodes[2].getElementsByTagName('span')[0].innerHTML.slice(0, 12);
                  custom_dates.push(new Date(date).toISOString().slice(0, 10));
                }
                console.log(custom_dates);

                this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, event, custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);

                this.setState({ event, custom_dates, map: this.state.map });
                console.log('update ' + this.state.event);
                console.log(this.state.custom_dates);    
              })
          }

          if (event === 'Dividends' || event === 'Stock splits') {
            const token = event === 'Stock splits' ? 'Split' : event;
            fetch(`/get${token}/${this.state.stock}`)
              .then(res => res.json())
              .then(custom_dates => {
                console.log(custom_dates);

                this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, event, custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);

                this.setState({ event, custom_dates, map: this.state.map });
                console.log('update ' + this.state.event);
                console.log(this.state.custom_dates);    
              })
          }
        }
      });
    }

    document.getElementById('submit').addEventListener('click', () => {
      for (const node of event_nodelist) {
        const event = node.value;
        if (node.checked && event === 'Custom dates') {
          const custom_dates_raw = document.getElementById('custom_dates').value;
          let custom_dates = [];
          if (custom_dates_raw !== '') {
            custom_dates = custom_dates_raw.split('\n');
          }
          this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, event, custom_dates, this.state.start_weekday, this.state.eb, this.state.threshold);
    
          this.setState({ event, custom_dates, map: this.state.map });
          console.log('update ' + this.state.event);
          console.log(this.state.custom_dates);
        }
      }
    });

    const eb_nodelist = document.getElementsByName('eb');
    for (const node of eb_nodelist) {
      node.addEventListener('change', (event) => {
        if (node.checked) {
          const eb = node.value;
          console.log('mounted and changed: ' + eb);

          this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, this.state.event, this.state.custom_dates, this.state.start_weekday, eb, this.state.threshold);
          this.setState({ eb, map: this.state.map });
          console.log('update ' + this.state.eb);
        }
      });
    }

    const threshold_node = document.getElementById('threshold');
    threshold_node.addEventListener('change', (event) => {
      const threshold = Number(threshold_node.value);
      if (threshold !== NaN) {
        console.log('mounted and changed: ' + threshold);

        this.row_filter(this.state.map, this.state.date_range_from, this.state.date_range_to, this.state.event, this.state.custom_dates, this.state.start_weekday, this.state.eb, threshold);
        this.setState({ threshold, map: this.state.map });
        console.log('update ' + this.state.threshold);
      }
    });

    const show_preceeding_node = document.getElementById('show_preceeding');
    show_preceeding_node.addEventListener('change', (event) => {
      const show_preceeding = Number(show_preceeding_node.value) || 0;
      if (show_preceeding >= 0) {
        console.log('mounted and changed: ' + show_preceeding);

        this.compute_change(this.state.map, this.state.start_oc, this.state.n_days, this.state.end_oc, show_preceeding, this.state.show_trailing);
        this.setState({ show_preceeding, map: this.state.map });
        console.log('update ' + this.state.show_preceeding);
      } else {
        show_preceeding_node.value = '0';
      }
    });

    const show_trailing_node = document.getElementById('show_trailing');
    show_trailing_node.addEventListener('change', (event) => {
      const show_trailing = Number(show_trailing_node.value) || 0;
      if (show_trailing >= 0) {
        console.log('mounted and changed: ' + show_trailing);

        this.compute_change(this.state.map, this.state.start_oc, this.state.n_days, this.state.end_oc, this.state.show_preceeding, show_trailing);
        this.setState({ show_trailing, map: this.state.map });
        console.log('update ' + this.state.show_trailing);
      } else {
        show_trailing_node.value = '0';
      }
    });
  }
}

export default App;
