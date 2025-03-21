// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $api_anthropic from "./routes/api/anthropic.ts";
import * as $api_chat from "./routes/api/chat.ts";
import * as $api_connect_career_history from "./routes/api/connect/career-history.ts";
import * as $api_connect_linkedin_callback from "./routes/api/connect/linkedin-callback.ts";
import * as $api_connect_linkedin from "./routes/api/connect/linkedin.ts";
import * as $api_cv_id_ from "./routes/api/cv/[id].ts";
import * as $api_cv_example from "./routes/api/cv/example.ts";
import * as $api_cv_index from "./routes/api/cv/index.ts";
import * as $api_deepseek from "./routes/api/deepseek.ts";
import * as $api_experience_update from "./routes/api/experience/update.ts";
import * as $api_joke from "./routes/api/joke.ts";
import * as $api_openai from "./routes/api/openai.ts";
import * as $api_test_env from "./routes/api/test-env.ts";
import * as $api_verify from "./routes/api/verify.ts";
import * as $api_xai from "./routes/api/xai.ts";
import * as $career_index from "./routes/career/index.tsx";
import * as $index from "./routes/index.tsx";
import * as $profile from "./routes/profile.tsx";
import * as $CVGenerator from "./islands/CVGenerator.tsx";
import * as $ChatArea from "./islands/ChatArea.tsx";
import * as $ContactSection from "./islands/ContactSection.tsx";
import * as $DocumentPreview from "./islands/DocumentPreview.tsx";
import * as $EditableExperienceTitle from "./islands/EditableExperienceTitle.tsx";
import * as $EditableSection from "./islands/EditableSection.tsx";
import * as $ExperienceSection from "./islands/ExperienceSection.tsx";
import * as $LinkedInButton from "./islands/LinkedInButton.tsx";
import * as $shared from "./islands/shared.ts";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_middleware.ts": $_middleware,
    "./routes/api/anthropic.ts": $api_anthropic,
    "./routes/api/chat.ts": $api_chat,
    "./routes/api/connect/career-history.ts": $api_connect_career_history,
    "./routes/api/connect/linkedin-callback.ts": $api_connect_linkedin_callback,
    "./routes/api/connect/linkedin.ts": $api_connect_linkedin,
    "./routes/api/cv/[id].ts": $api_cv_id_,
    "./routes/api/cv/example.ts": $api_cv_example,
    "./routes/api/cv/index.ts": $api_cv_index,
    "./routes/api/deepseek.ts": $api_deepseek,
    "./routes/api/experience/update.ts": $api_experience_update,
    "./routes/api/joke.ts": $api_joke,
    "./routes/api/openai.ts": $api_openai,
    "./routes/api/test-env.ts": $api_test_env,
    "./routes/api/verify.ts": $api_verify,
    "./routes/api/xai.ts": $api_xai,
    "./routes/career/index.tsx": $career_index,
    "./routes/index.tsx": $index,
    "./routes/profile.tsx": $profile,
  },
  islands: {
    "./islands/CVGenerator.tsx": $CVGenerator,
    "./islands/ChatArea.tsx": $ChatArea,
    "./islands/ContactSection.tsx": $ContactSection,
    "./islands/DocumentPreview.tsx": $DocumentPreview,
    "./islands/EditableExperienceTitle.tsx": $EditableExperienceTitle,
    "./islands/EditableSection.tsx": $EditableSection,
    "./islands/ExperienceSection.tsx": $ExperienceSection,
    "./islands/LinkedInButton.tsx": $LinkedInButton,
    "./islands/shared.ts": $shared,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
