export default {
  get index() {
    return "This is the home page.";
  },
  get someProp() {
    return "Hello, world.";
  },
  add: (x, y) => {
    return x + y;
  },
  addAsync: async (x, y) => {
    return x + y;
  },
  ns1: {
    ns2: {
      get someProp() {
        return "A beautiful day.";
      },
      echo: (x, y, z) => {
        return { x, y, z };
      }
    }
  }
}
