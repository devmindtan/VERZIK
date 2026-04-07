/**
 * Help Service - Template (API connections removed)
 */

export interface HelpArticle {
  id: string;
  section_key: string;
  parent_key: string | null;
  type: "document" | "question";
  title: string;
  summary: string;
  content: string;
  tech_detail: string | null;
  sort_order: number;
  is_published: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateArticlePayload {
  section_key: string;
  parent_key: string | null;
  type?: "document" | "question";
  title: string;
  summary: string;
  content: string;
  tech_detail?: string | null;
  sort_order?: number;
}

export interface UpdateArticlePayload extends Partial<CreateArticlePayload> {
  is_published?: boolean;
}

export interface ArticlesResponse {
  success: boolean;
  data: HelpArticle[];
}

/**
 * Mock get help articles
 */
export async function getHelpArticles(): Promise<HelpArticle[]> {
  // TODO: Connect to your API
  return [];
}

/**
 * Mock create help article
 */
export async function createHelpArticle(payload: CreateArticlePayload): Promise<HelpArticle> {
  // TODO: Connect to your API
  console.log("Create help article:", payload);
  throw new Error("Not implemented");
}

/**
 * Mock update help article
 */
export async function updateHelpArticle(
  id: string,
  payload: UpdateArticlePayload
): Promise<HelpArticle> {
  // TODO: Connect to your API
  console.log("Update help article:", id, payload);
  throw new Error("Not implemented");
}

/**
 * Mock toggle publish article
 */
export async function togglePublishArticle(id: string): Promise<void> {
  // TODO: Connect to your API
  console.log("Toggle publish article:", id);
}

/**
 * Mock delete help article
 */
export async function deleteHelpArticle(id: string): Promise<void> {
  // TODO: Connect to your API
  console.log("Delete help article:", id);
}

export interface ArticleTreeNode {
  article: HelpArticle;
  children: ArticleTreeNode[];
}

/**
 * Build article tree from flat array
 */
export function buildArticleTree(articles: HelpArticle[]): ArticleTreeNode[] {
  const map = new Map<string, ArticleTreeNode>();
  const roots: ArticleTreeNode[] = [];

  articles.forEach(a => {
    map.set(a.section_key, { article: a, children: [] });
  });

  articles.forEach(a => {
    const node = map.get(a.section_key)!;
    if (a.parent_key && map.has(a.parent_key)) {
      map.get(a.parent_key)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: ArticleTreeNode[]) => {
    nodes.sort((a, b) => a.article.sort_order - b.article.sort_order);
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}
