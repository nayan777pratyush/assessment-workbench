export async function runInContainer(options: {
  image: string;
  files: Record<string, string>;
  command: string[];
  timeoutMs: number;
}) {
  // create temporary workspace
  // write candidate files
  // docker run
  // --network none
  // --memory 256m
  // --cpus 1
  // --pids-limit 64
  // --read-only
  // --cap-drop ALL
  // --security-opt no-new-privileges
  // timeout
  // capture stdout/stderr
  // remove container/workspace
}