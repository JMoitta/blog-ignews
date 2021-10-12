import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useEffect, useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  page: number;
  total_pages: number;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(postsPagination.page);

  const formattedPost = (postsPrismic: Post[]): Post[] => {
    const postsFormatted = postsPrismic.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        "dd MMM yyyy', às' HH:mm:ss",
        {
          locale: ptBR,
        }
      ),
    }));
    return postsFormatted;
  };
  useEffect(() => {
    const postsFormatted = formattedPost(postsPagination.results);
    setPosts(postsFormatted);
  }, [postsPagination.results]);

  async function loadMorePosts(): Promise<void> {
    const nextPage = page + 1;
    const response = await fetch(`/api/posts?page=${nextPage}`);
    const data = await response.json();
    const resultsFormatted = formattedPost(data.results);
    setPosts([...posts, ...resultsFormatted]);
    setPage(nextPage);
  }

  return (
    <>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <p className={styles.subtitle}>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <div>
                    <FiCalendar size={20} />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div>
                    <FiUser size={20} />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
          <footer className={styles.footer}>
            {page < postsPagination.total_pages && (
              <button type="button" onClick={loadMorePosts}>
                Carregar mais posts
              </button>
            )}
          </footer>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'postblog')],
    {
      fetch: ['postblog.title', 'postblog.subtitle', 'postblog.author'],
      pageSize: 2,
      orderings: '[document.first_publication_date]',
    }
  );
  const posts = postsResponse.results.map<Post>(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        ...postsResponse,
        results: posts,
        next_page: postsResponse.next_page ? 'link' : null,
      },
    },
    revalidate: 60 * 60 * 3, // 3 horas
  };
};
