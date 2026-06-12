import { Card } from "@/components/ui/card";
import { getAllUsers, searchUsers, getUsersCount, searchUsersCount } from "@/lib/db/queries";
import { SearchInput } from "@/components/admin/search-input";
import { Pagination } from "@/components/admin/pagination";
import { UsersTable } from "@/components/admin/users-table";
import { Suspense } from "react";
import { Users as UsersIcon } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";

const ITEMS_PER_PAGE = 20;

export const metadata: Metadata = {
  title: 'Users Management',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function UsersContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('adminUsersPage');
  const search = await searchParams;
  const searchQuery = typeof search.search === "string" ? search.search : "";
  const currentPage = typeof search.page === "string" ? parseInt(search.page) : 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [users, totalCount] = await Promise.all([
    searchQuery
      ? searchUsers(searchQuery, offset, ITEMS_PER_PAGE)
      : getAllUsers(offset, ITEMS_PER_PAGE),
    searchQuery ? searchUsersCount(searchQuery) : getUsersCount(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <UsersIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('totalUsers', { defaultValue: 'Total Users' })}
              </p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t('searchResults', { defaultValue: 'Search Results' })
                : t('currentPage', { defaultValue: 'Current Page' })}
            </p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages', { defaultValue: 'Pages' })}
            </p>
            <p className="text-2xl font-bold">{totalPages}</p>
          </div>
        </Card>
      </div>

      <Card>
        <UsersTable users={users} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Card>
    </>
  );
}

export default async function AdminUsersPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('adminUsersPage');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t('title', { defaultValue: 'Users Management' })}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('subtitle', { defaultValue: 'Manage and monitor all user accounts' })}
          </p>
        </div>
      </div>

      <SearchInput placeholder={t('searchPlaceholder', { defaultValue: 'Search users...' })} />

      <Suspense
        fallback={
          <Card className="p-8">
            <p className="text-center text-muted-foreground">
              {t('loading', { defaultValue: 'Loading...' })}
            </p>
          </Card>
        }
      >
        <UsersContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
