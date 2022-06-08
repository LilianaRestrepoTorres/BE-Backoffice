import {
  Directors,
  Movies,
  Musicians,
  PrismaClient,
  Titles,
  Writers,
} from '@prisma/client';

type ResolverContext = {
  orm: PrismaClient;
};

export async function createAMovie(
  parent: unknown,
  {
    data,
  }: {
    data: Pick<
      Movies,
      | 'status'
      | 'userName'
      | 'filmDescription'
      | 'duration'
      | 'movieBanner'
      | 'linkWiki'
      | 'releaseDate'
      | 'audienceScore'
    > &
      Titles;
  },
  context: ResolverContext
): Promise<Movies> {
  const {
    status,
    userName,
    filmDescription,
    duration,
    movieBanner,
    linkWiki,
    releaseDate,
    audienceScore,
    ...titles
  } = data;
  const title = await context.orm.titles.findUnique({
    where: { title: titles.title }
  });
  const originalTitle = await context.orm.titles.findUnique({
    where: { originalTitle: titles.originalTitle }
  });
  if (title) {
    throw new Error(`That Title "${titles.title}"already exists.`);
  }else if (originalTitle) {
    throw new Error(`That Original Title "${titles.originalTitle}"already exists.`);
  }
  return await context.orm.movies.create({
    data: {
      filmDescription,
      duration,
      userName,
      status,
      movieBanner,
      linkWiki,
      releaseDate,
      audienceScore,
      title: {
        create: {
          ...titles,
        },
      },
    },
    include: {
      title: true,
    },
  });
}

export const resolver: Record<
  keyof (Movies & { title: Titles } & { directors: Directors } & {
    musicians: Musicians;
  } & { writers: Writers }),
  (
    parent: Movies & { title: Titles } & { directors: Directors } & {
      musicians: Musicians;
    } & { writers: Writers }
  ) => unknown
> = {
  id: (parent) => parent.id,
  createdAt: (parent) => parent.createdAt,
  updatedAt: (parent) => parent.updatedAt,
  duration: (parent) => parent.duration,
  audienceScore: (parent) => parent.audienceScore,
  filmDescription: (parent) => parent.filmDescription,
  linkWiki: (parent) => parent.linkWiki,
  movieBanner: (parent) => parent.movieBanner,
  releaseDate: (parent) => parent.releaseDate,
  status: (parent) => parent.status,
  userName: (parent) => parent.userName,
  title: (parent) => ({
    title: parent.title.title,
    originalTitle: parent.title.originalTitle,
    romajiTitle: parent.title.romajiTitle,
  }),
  directors: (parent) => ({
    id: parent.directors.id,
    name: parent.directors.name,
  }),
  musicians: (parent) => ({
    name: parent.musicians.name,
  }),
  writers: (parent) => ({
    name: parent.writers.name,
  }),
};

export async  function updateAMovie(
  parent: unknown,
  arg: {
    id: string;
    data: {
      data: Pick<
        Movies,
        | 'status'
        | 'userName'
        | 'filmDescription'
        | 'duration'
        | 'movieBanner'
        | 'linkWiki'
        | 'releaseDate'
      >;
    };
  },
  context: ResolverContext
): Promise<Movies> {
  const movie = await context.orm.movies.findUnique({
    where: { id: parseInt(arg.id, 10) }
  });
  if (!movie) {
    throw new Error(`The Movie with id ${arg.id}, does not exist.`);
  }
  return context.orm.movies.update({
    where: { id: parseInt(arg.id, 10) },
    data: arg.data,
  });
}

export async function deleteMovie(
  parent: unknown,
  arg: { id: string },
  context: ResolverContext
) {
  const movie = await context.orm.movies.findUnique({
    where: { id: parseInt(arg.id, 10) }
  });
  if (!movie) {
    throw new Error(`The Movie with id ${arg.id}, does not exist.`);
  }
  await context.orm.movies.delete({
    where: { id: parseInt(arg.id, 10) },
  });
  return `The Movie with ${arg.id} Id was deleted`;
}

export async function addPeople(
  parent: unknown,
  arg: {
    movieId: string;
    data: { writersId: number[]; directorsId: number[]; musiciansId: number[] };
  },
  context: ResolverContext
): Promise<Movies | null> {

  for (const id of arg.data.musiciansId) {
    await context.orm.movies.update({
      where: { id: parseInt(arg.movieId, 10) },
      data: {
        musicians: {
          connect: {
            id,
          },
        },
      },
    });
  }
  for (const id of arg.data.writersId) {
    await context.orm.movies.update({
      where: { id: parseInt(arg.movieId, 10) },
      data: {
        writers: {
          connect: {
            id,
          },
        },
      },
    });
  }
  for (const id of arg.data.directorsId) {
    await context.orm.movies.update({
      where: { id: parseInt(arg.movieId, 10) },
      data: {
        directors: {
          connect: {
            id,
          },
        },
      },
    });
  }
  return await context.orm.movies.findUnique({
    where: {
      id: parseInt(arg.movieId, 10),
    },
    include: {
      directors: true,
      musicians: true,
      writers: true,
    },
  });
}
