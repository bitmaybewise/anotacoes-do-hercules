var informations = [
  { day: '2016-02-26', weight: 82,   abdomen: 92,   thigh: 59,   arm: 29.5 },
  { day: '2016-03-05', weight: 80.2, abdomen: 90,   thigh: 57,   arm: 28.5 },
  { day: '2016-03-12', weight: 80,   abdomen: 88,   thigh: 58,   arm: 28.5 },
  { day: '2016-03-19', weight: 77.9, abdomen: 90,   thigh: 57,   arm: 28.5 },
  { day: '2016-03-27', weight: 76.5, abdomen: 88,   thigh: 58,   arm: 28.5 },
  { day: '2016-04-03', weight: 76.5, abdomen: 85.5, thigh: 58,   arm: 28   },
  { day: '2016-04-09', weight: 75.5, abdomen: 84,   thigh: 56,   arm: 27.5 },
  { day: '2016-04-16', weight: 76,   abdomen: 86,   thigh: 57.5, arm: 28   },
  { day: '2016-04-23', weight: 74.6, abdomen: 84,   thigh: 57,   arm: 27   },
  { day: '2016-05-01', weight: 74.3, abdomen: 83,   thigh: 57.5, arm: 27.5 }
];

var days = informations.map(function(info) { return info.day; }),
  c3days = ['day'].concat(days);

function c3WeekDataFor(attr) {
  var values = informations.map(function(info) { return info[attr]; }),
    c3attrs = [attr].concat(values);

  return {
    bindto: '#' + attr,
    data: {
      x: 'day',
      columns: [c3days, c3attrs]
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%d/%m/%Y' 
        }
      }
    }
  };
}

c3.generate(c3WeekDataFor('weight'));
c3.generate(c3WeekDataFor('abdomen'));
c3.generate(c3WeekDataFor('thigh'));
c3.generate(c3WeekDataFor('arm'));
