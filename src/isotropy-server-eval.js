import url from "url";
import querystring from "querystring";
import formidable from "formidable";
import promisify from "nodefunc-promisify";
import * as acorn from "acorn";
import evalExpression from "isotropy-eval";

const formParse = promisify((req, form, cb) => form.parse(req, cb), { hasMultipleResults: true });

function parseObj(obj) {
  for (const key in obj) {
    const item = obj[key];
    obj[key] = typeof item === "string" ? JSON.parse(item) : item;
  }
  return obj;
}

export default async function(req, app, options = { default: "index" }) {
  const parsed = url.parse(req.url);
  const expression = decodeURI(parsed.pathname.slice(1)) || options.default;

  const queryParams = querystring.parse(parsed.query);
  const [fields, files] = ["POST", "PUT"].includes(req.method.toUpperCase()) ? (await formParse(req, new formidable.IncomingForm())) : [{}, {}];
  const argsDict = { ...parseObj(queryParams), ...parseObj(fields), ...files };
  return await evalExpression(expression, app, argsDict);
}
