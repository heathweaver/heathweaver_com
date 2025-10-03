import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET(_ctx) {
    try {
      const exampleCV = await Deno.readTextFile(
        "./backend/artifacts/HeathWeaver_VpOfMarketing,Emea_01927.json",
      );
      return new Response(exampleCV, {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to load example CV" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
  },
});
