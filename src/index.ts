import express from 'express';
import { middlewareLogResponses, middlewareMetricsInc } from './middleware.js';
import { handlerReadiness } from './api/readiness.js';
import { handlerMetrics } from './api/metrics.js';
import { handlerReset } from './api/reset.js';

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc, express.static("./src/app"));

app.get("/healthz", handlerReadiness);
app.get("/metrics", handlerMetrics);
app.get("/reset", handlerReset);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// app.use(middlewareLogResponses);
// app.use("/app", middlewareMetricsInc, express.static("./src/app"));
//
// app.get('/healthz', (req: Request, res: Response) => {
//   res.set({
//     'Content-Type': 'text/plain',
//   });
//   res.send('OK');
// });
//
// app.get('/metrics', (req: Request, res: Response) => {
//   res.set({
//     'Content-Type': 'text/plain',
//   });
//   res.send(`Hits: ${config.fileserverHits}`);
// });
//
// app.get('/reset', (req: Request, res: Response) => {
//   res.set({
//     'Content-Type': 'text/plain',
//   });
//   config.fileserverHits = 0;
//   res.send('OK');
// });
//
// app.listen(PORT, () => {
//   console.log(`Server is running at http://localhost:${PORT}`);
// });
