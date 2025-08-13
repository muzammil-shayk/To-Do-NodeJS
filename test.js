function getUser(userId, nextUser) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`User ID: ${userId}`);
      resolve("Success");
      if (nextUser) {
        nextUser();
      }
    }, 2000);
  });
}

//callbacks
getUser(1, () => {
  getUser(2, () => {
    getUser(3, () => {
      getUser(4);
    });
  });
});

//promise chaining
getUser(1)
  .then((res) => {
    return getUser(2);
  })
  .then((res) => {
    return getUser(3);
  })
  .then((res) => {
    console.log(res);
  });

//async-await
// async function getAllData() {
//   await getUser(1);
//   await getUser(2);
//   await getUser(3);
//   await getUser(4);
//   await getUser(5);
// }
// getAllData();

//IIFE - Immediate Invoked Function Expression
(async function () {
  await getUser(1);
  await getUser(2);
  await getUser(3);
  await getUser(4);
  await getUser(5);
})();
