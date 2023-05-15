#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BlogArticleStack } from "../lib/blog-article-stack";

const app = new cdk.App();
new BlogArticleStack(app, "BlogArticleStack", {});
