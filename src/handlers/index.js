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
import handlePullRequestReview from './pull_request_review.js';
import handlePullRequestReviewComment from './pull_request_review_comment.js';
import handleCheckRun from './check_run.js';
import handleCheckSuite from './check_suite.js';
import handleDependabotAlert from './dependabot_alert.js';
import handleSecretScanningAlert from './secret_scanning_alert.js';

export const handlers = {
  ping: handlePing,
  push: handlePush,
  pull_request: handlePullRequest,
  pull_request_review: handlePullRequestReview,
  pull_request_review_comment: handlePullRequestReviewComment,
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
  check_run: handleCheckRun,
  check_suite: handleCheckSuite,
  dependabot_alert: handleDependabotAlert,
  secret_scanning_alert: handleSecretScanningAlert,
  deployment: handleDeployment,
  deployment_status: handleDeploymentStatus
};

export default handlers;
