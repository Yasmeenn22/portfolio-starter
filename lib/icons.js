// Real brand icons (fetched with the Taste Skill's icons.mjs into assets/icons).
// Imported, not linked from /public, so they keep working on GitHub Pages.
import linkedin from "@/assets/icons/linkedin.svg";
import github from "@/assets/icons/github.svg";
import dribbble from "@/assets/icons/dribbble.svg";
import behance from "@/assets/icons/behance.svg";
import medium from "@/assets/icons/medium.svg";
import scholar from "@/assets/icons/googlescholar.svg";
import youtube from "@/assets/icons/youtube.svg";
import figma from "@/assets/icons/figma.svg";
import react from "@/assets/icons/react.svg";
import nextjs from "@/assets/icons/nextjs.svg";
import typescript from "@/assets/icons/typescript.svg";
import javascript from "@/assets/icons/javascript.svg";
import tailwind from "@/assets/icons/tailwindcss.svg";
import vue from "@/assets/icons/vue.svg";
import nodejs from "@/assets/icons/nodejs.svg";
import nestjs from "@/assets/icons/nestjs.svg";
import graphql from "@/assets/icons/graphql.svg";
import postgres from "@/assets/icons/postgres.svg";
import redis from "@/assets/icons/redis.svg";
import aws from "@/assets/icons/aws.svg";
import gcloud from "@/assets/icons/google-cloud.svg";
import docker from "@/assets/icons/docker.svg";
import kubernetes from "@/assets/icons/kubernetes.svg";
import terraform from "@/assets/icons/terraform-icon.svg";
import ghactions from "@/assets/icons/github-actions.svg";
import storybook from "@/assets/icons/storybook.svg";
import firebase from "@/assets/icons/firebase.svg";
import mongodb from "@/assets/icons/mongodb.svg";
import python from "@/assets/icons/python.svg";
import swift from "@/assets/icons/swift.svg";
import webrtc from "@/assets/icons/webrtc.svg";

// Monochrome marks that need the text colour in dark mode.
export const inkIcons = new Set([github, medium, nextjs, behance]);

export const socialIcons = { linkedin, github, dribbble, behance, medium, scholar, youtube };

const techIcons = {
  figma, react, "react native": react, "next.js": nextjs, typescript, javascript,
  "tailwind css": tailwind, vue, "node.js": nodejs, nestjs, graphql, postgresql: postgres,
  redis, aws, "google cloud": gcloud, docker, kubernetes, terraform, "github actions": ghactions,
  storybook, firebase, mongodb, python, "swift (basic)": swift, webrtc, "figma tokens": figma,
};

export function techIcon(name) {
  return techIcons[name.toLowerCase()] || null;
}
