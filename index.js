const yaml = require('js-yaml');
const { generateSantas } = require('./modules/santas');

const families = [
  ['Adrien', 'Antoine', 'Maryvone', 'Hugo', 'Noel-gilles'],
  ['Louise', 'Sadyo', 'Pierre-Marie', 'Marie-Odile', 'Quentin'],
  ['Valérie', 'Pascal', 'Nathan', 'Marion'],
  ['Christelle', 'Daniel', 'Manon', 'Rémi'],
  ['Thérèse', 'Joseph'],
];

const start = Date.now();
Array.from({ length: 15 }).reduce((past, _, i) => {
  const cStart = Date.now();
  console.log('-----------');
  console.log(`Chistmas ${i + 1}`);
  console.log('-----------');
  const christmas = generateSantas(past.map(p => p.santas), families);
  console.log(yaml.dump(christmas));
  console.log(`duration: ${Date.now() - cStart}ms`);
  console.log(' ');
  return [...past, christmas];
}, []);

console.log('-----------');
console.log(`total duration: ${Date.now() - start}ms`);
