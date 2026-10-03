import http from "node:http";
import { initTRPC } from "@trpc/server";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { z } from "zod";

// Сервер

const t = initTRPC.create();

const appRouter = t.router({
  hello: t.procedure
    .input(z.string())
    .query(({ input }) => {
      return `Привет, ${input}!`;
    }),

  add: t.procedure
    .input(
      z.object({
        a: z.number(),
        b: z.number(),
      })
    )
    .query(({ input }) => {
      return input.a + input.b;
    }),

  multiply: t.procedure
    .input(
      z.object({
        a: z.number(),
        b: z.number(),
      })
    )
    .query(({ input }) => {
      return input.a * input.b;
    }),
});

type AppRouter = typeof appRouter;

const handler = createHTTPHandler({
  router: appRouter,
});

const server = http.createServer((req, res) => {
  handler(req, res);
});

server.listen(3000, async () => {
  console.log("Сервер запущен: http://localhost:3000");

  //Клиент 

  const client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3000",
      }),
    ],
  });

  try {
    const hello = await client.hello.query("Андрей");
    console.log(hello);

    const sum = await client.add.query({
      a: 15,
      b: 27,
    });
    console.log("15 + 27 =", sum);

    const multiplication = await client.multiply.query({
      a: 12,
      b: 8,
    });
    console.log("12 × 8 =", multiplication);
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    server.close();
  }
});