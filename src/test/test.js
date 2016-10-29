import 'source-map-support/register';
import should from 'should';
import invoke from "../isotropy-server-eval";
import app from "./app";
import request from "request";
import promisify from "nodefunc-promisify";
import http from "http";
import evalExpression from "../isotropy-server-eval";
let onRequest;

function getHttpRequest(fnMakeRequest) {
  return new Promise((resolve, reject) => {
    onRequest = resolve;
    fnMakeRequest();
  });
}

function getUrl(path, params, method) {
  let expressionPath;
  if (method === "GET") {
    const arr = Object.keys(params).map(key => [key, params[key]]);
    expressionPath = arr.length ? `${path}?${arr.map(i => `${i[0]}=${i[1]}`).join("&")}` : path;
  } else if (method === "POST") {
    expressionPath = path;
  }
  return `http://localhost:8086${(/^\//.test(expressionPath) ? "" : "/") + expressionPath}`
}

function createTest(opts) {
  it(`${opts.text}(HTTP ${opts.method}${opts.contentType ? ` ${opts.contentType}` : ""})`, async () => {
    const req = opts.method === "GET" ?
      await getHttpRequest(() => request.get(getUrl(opts.url, opts.params, opts.method))) :
      await getHttpRequest(() => request.post({
        url: getUrl(opts.url, opts.params, opts.method),
        [{ JSON: "json", FORM: "formData" }[opts.contentType]]: opts.params
      }));
    const result = await evalExpression(req, app, { default: "index" });
    if (typeof opts.result === "object") {
      result.should.deepEqual(opts.result);
    } else {
      result.should.equal(opts.result);
    }
  });
}

describe("Isotropy Eval", () => {
  before(() => {
    const server = http.createServer((req, res) => {
      onRequest(req);
    });
    server.listen(8086);
  });

  [["GET", ""], ["POST", "FORM"], ["POST", "JSON"]].map(([method, contentType]) => [
      { text: "Should call default function", url: "", params: {}, method, contentType, result: "This is the home page." },
      { text: "Should call property someProp", url: "/someProp", params: {}, method, contentType, result: "Hello, world." },
      { text: "Should call function add(x, y)", url: "/add(x, y)", params: { x: 10, y: 20 }, method, contentType, result: 30 },
      { text: "Should call function with mix of literals and variables add(x, 20)", url: "/add(x, 20)", params: { x: 10 }, method, contentType, result: 30 },
      { text: "Should call async function addAsync(x, y)", url: "/addAsync(x, y)", params: { x: 10, y: 20 }, method, contentType, result: 30 },
      { text: "Should call property inside namespace ns1.ns2.someProp", url: "/ns1.ns2.someProp", params: {}, method, contentType, result: "A beautiful day." },
      { text: "Should call function inside namespace ns1.ns2.echo(x, y, z)", url: "/ns1.ns2.echo(x, y, z)", params: { x: 1, y: "true", z: `"yes"` }, method, contentType, result: { x: 1, y: true, z: 'yes' } },
  ]).forEach(tests => tests.forEach(opts => createTest(opts)));

});
