'use server';

/**
 * @fileOverview Server Action to fetch GitHub repository ZIP archives.
 * This bypasses CORS restrictions that prevent client-side fetches from GitHub's download servers.
 */

export async function fetchGithubRepo(owner: string, repo: string) {
  try {
    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;
    
    const response = await fetch(zipUrl, {
      headers: {
        'Accept': 'application/vnd.github+json',
        // Optional: Add a User-Agent which GitHub requires
        'User-Agent': 'CodeWhisper-App'
      },
      // Ensure we don't cache the ZIP file as repos change
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error("Repository not found. Ensure it is public.");
      if (response.status === 403) throw new Error("GitHub API rate limit exceeded.");
      throw new Error(`GitHub returned an error (${response.status}).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    // Return as base64 to pass through the server action boundary
    return {
      success: true,
      data: Buffer.from(arrayBuffer).toString('base64'),
      contentType: response.headers.get('content-type') || 'application/zip'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred while fetching the repository."
    };
  }
}
