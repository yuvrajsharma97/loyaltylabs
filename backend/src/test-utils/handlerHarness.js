// Shared helpers for unit-testing Express handlers with mocked Mongoose models.

// A mocked query that works both awaited directly and chained with .session().
function query(value) {
  return {
    session: () => Promise.resolve(value),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject)
  };
}

// Stand-in for mongoose.startSession(): runs the transaction body once, inline.
function fakeSession() {
  return {
    withTransaction: async (fn) => fn(),
    endSession: jest.fn()
  };
}

// asyncHandler doesn't return its promise, so wait for whichever of
// res.json / next(err) happens first. Resolves { status, body } or rejects
// with the error passed to next().
function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ status: this.statusCode, body });
        return this;
      }
    };
    handler(req, res, (err) => (err ? reject(err) : resolve({ status: res.statusCode, body: undefined })));
  });
}

module.exports = { query, fakeSession, invoke };
