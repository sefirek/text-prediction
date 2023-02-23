console.clear();
let prev = 2;
Math.random = () => {
  const x = Math.sin(prev) * 1000;
  prev = x - Math.floor(x);
  return prev;
};

Math.random.reset = () => {
  prev = 2;
  return Math;
};
