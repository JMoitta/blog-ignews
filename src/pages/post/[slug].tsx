import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { ReactNode } from 'react';
import { RichText, RichTextBlock } from 'prismic-reactjs';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import { formatterDatePublication } from '../../services/formatterDate';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface IPost {
  uid: string;
  first_publication_date: string | null;
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

interface PostProps {
  post: IPost;
}

export default function Post({ post }: PostProps): ReactNode {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div>
        <p>Carregando...</p>
      </div>
    );
  }

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
  };

  // console.log(RichText.asHtml(postFormat.formatContent[0].body));

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
          <div className={styles.postContent}>
            {postFormat.formatContent.map(document => (
              <div key={document.heading}>
                <h3>{document.heading}</h3>
                {RichText.render(document.body)}
              </div>
            ))}
          </div>
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
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const postPrismic = await prismic.getByUID('postblog', String(slug), {});

  const post: IPost = {
    uid: postPrismic.uid,
    first_publication_date: postPrismic.first_publication_date,
    data: {
      title: postPrismic.data.title,
      subtitle: postPrismic.data.subtitle,
      banner: {
        url: postPrismic.data.banner.url,
      },
      author: postPrismic.data.author,
      content: postPrismic.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // minutos
  };
};
