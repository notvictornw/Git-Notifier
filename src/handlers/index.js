import handlePing from './ping.js';
import handlePush from './push.js';
import handlePullRequest from './pull_request.js';
import handleIssues from './issues.js';
import handleIssueComment from './issue_comment.js';
import handleCommitComment from './commit_comment.js';
import handleRelease from './release.js';
import handleCreate from './create.js';
import handleDelete from './delete.js';
import handleFork from './fork.js';
import handleWatch from './watch.js';
import handleDiscussion from './discussion.js';
import handleDiscussionComment from './discussion_comment.js';
import handleWorkflowRun from './workflow_run.js';
import handleWorkflowJob from './workflow_job.js';
import handleDeployment from './deployment.js';
import handleDeploymentStatus from './deployment_status.js';

export const handlers = {
  ping: handlePing,
  push: handlePush,
  pull_request: handlePullRequest,
  issues: handleIssues,
  issue_comment: handleIssueComment,
  commit_comment: handleCommitComment,
  release: handleRelease,
  create: handleCreate,
  delete: handleDelete,
  fork: handleFork,
  watch: handleWatch,
  discussion: handleDiscussion,
  discussion_comment: handleDiscussionComment,
  workflow_run: handleWorkflowRun,
  workflow_job: handleWorkflowJob,
  deployment: handleDeployment,
  deployment_status: handleDeploymentStatus
};

export default handlers;
