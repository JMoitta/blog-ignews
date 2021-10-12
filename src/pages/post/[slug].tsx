import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { ReactNode, useEffect } from 'react';
import { RichText, RichTextBlock } from 'prismic-reactjs';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../../services/prismic';
import { formatterDatePublication } from '../../services/formatterDate';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface IPost {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    banner: {
      url: string;
    };
    author: string;
    title: string;
    subtitle: string;
    content: {
      heading: string;
      body: RichTextBlock[];
    }[];
  };
}

interface NavPost {
  uid?: string;
  data: {
    title: string;
  };
}

interface PostProps {
  post: IPost;
  prevPost?: NavPost;
  nextPost?: NavPost;
  preview: boolean;
}

export default function Post({
  post,
  prevPost,
  nextPost,
  preview,
}: PostProps): ReactNode {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div>
        <p>Carregando...</p>
      </div>
    );
  }

  const createScripComments = (): void => {
    const script = document.createElement('script');
    const anchor = document.getElementById('comments-post');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', '');
    script.setAttribute('label', 'blogIgnews');
    script.setAttribute('repo', 'JMoitta/blog-ignews');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    anchor.innerHTML = '';
    anchor.appendChild(script);
  };

  const postFormat = {
    ...post,
    createDateFormat: formatterDatePublication(post.first_publication_date),
    tempoDeLeitura: Math.ceil(
      post.data.content
        .map(document => [
          document.heading.split(' ').length,
          ...document.body.map(section => section.text.split(' ').length),
        ])
        .reduce((lista, value) => [...lista, ...value], [])
        .reduce((total, value) => total + value, 0) / 155
    ),
    formatContent: post.data.content.map(({ heading, body }) => ({
      heading,
      body,
    })),
    formatedDateEdited: format(
      new Date(post.last_publication_date),
      " dd MMM yyyy', às ' HH:mm",
      {
        locale: ptBR,
      }
    ),
  };

  useEffect((): void => {
    createScripComments();
  }, []);

  return (
    <>
      <Head>
        <title>{postFormat.data.title} | Ignews</title>
      </Head>
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{postFormat.data.title}</h1>
          <p className={styles.subTitle}>{postFormat.data.subtitle}</p>
          <div className={styles.info}>
            <time>
              <span>
                <FiCalendar size={24} />
              </span>
              {postFormat.createDateFormat}
            </time>

            <div>
              <span>
                <FiUser size={24} />
              </span>
              {postFormat.data.author}
            </div>
            <div>
              <span>
                <FiClock size={24} />
              </span>
              {`${postFormat.tempoDeLeitura} min`}
            </div>
          </div>
          <div className={styles.edited}>
            <i>
              * editado em
              {postFormat.formatedDateEdited}
            </i>
          </div>
          <div className={styles.postContent}>
            {postFormat.formatContent.map(document => (
              <div key={document.heading}>
                <h3>{document.heading}</h3>
                {RichText.render(document.body)}
              </div>
            ))}
          </div>
          <nav className={styles.navPostsContent}>
            {prevPost ? (
              <div>
                <p className={styles.titleNavLink}>{prevPost.data.title}</p>
                <Link href={`/post/${prevPost.uid}`}>
                  <a className={commonStyles.link}>Post anterior</a>
                </Link>
              </div>
            ) : (
              <div />
            )}
            {nextPost && (
              <div className={styles.navNextPost}>
                <p className={styles.titleNavLink}>{nextPost.data.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a className={commonStyles.link}>Próximo post</a>
                </Link>
              </div>
            )}
          </nav>
          <div id="comments-post" />
          {preview && (
            <aside className={styles.actionPreview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'postblog'),
  ]);

  const posts = response.results.map(document => ({
    params: {
      slug: document.uid,
    },
  }));
  return {
    paths: posts,
    fallback: 'blocking', // 'blocking'
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('postblog', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post: IPost = response;

  const responsePrev = await prismic.query(
    [
      Prismic.predicates.at('document.type', 'postblog'),
      Prismic.Predicates.dateBefore(
        'document.first_publication_date',
        new Date(post.first_publication_date)
      ),
    ],
    {
      fetch: ['postblog.title'],
      after: post.uid,
      pageSize: 1,
      orderings: '[my.postblog.title desc]',
    }
  );

  const responseNext = await prismic.query(
    [
      Prismic.predicates.at('document.type', 'postblog'),
      Prismic.Predicates.dateAfter(
        'document.first_publication_date',
        new Date(post.first_publication_date)
      ),
    ],
    {
      fetch: ['postblog.title'],
      after: post.uid,
      pageSize: 1,
      orderings: '[my.postblog.title]',
    }
  );

  const prevPost: NavPost = responsePrev.results[0] ?? null;
  const nextPost: NavPost = responseNext.results[0] ?? null;
  return {
    props: {
      post,
      prevPost,
      nextPost,
      preview,
    },
    revalidate: 60 * 30, // 30 minutos
  };
};
