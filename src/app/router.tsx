import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "@/components/layout/root-layout";
import { PageLoader } from "@/components/layout/page-loader";
import { ErrorBoundary } from "@/components/error-boundary";

const Home = lazy(() => import("@/pages/Home"));
const CompressIndex = lazy(() => import("@/pages/compress/CompressIndex"));
const CompressPdf = lazy(() => import("@/pages/compress/CompressPdf"));
const CompressImage = lazy(() => import("@/pages/compress/CompressImage"));
const ResizeIndex = lazy(() => import("@/pages/resize/ResizeIndex"));
const ResizeImage = lazy(() => import("@/pages/resize/ResizeImage"));
const ConvertIndex = lazy(() => import("@/pages/convert/ConvertIndex"));
const ConvertImage = lazy(() => import("@/pages/convert/ConvertImage"));
const PdfToolsIndex = lazy(() => import("@/pages/pdf-tools/PdfToolsIndex"));
const MergePdf = lazy(() => import("@/pages/pdf-tools/MergePdf"));
const SplitPdf = lazy(() => import("@/pages/pdf-tools/SplitPdf"));
const RotatePdf = lazy(() => import("@/pages/pdf-tools/RotatePdf"));
const ReorderPdf = lazy(() => import("@/pages/pdf-tools/ReorderPdf"));
const DeletePagesPdf = lazy(() => import("@/pages/pdf-tools/DeletePagesPdf"));
const ExtractPagesPdf = lazy(() => import("@/pages/pdf-tools/ExtractPagesPdf"));
const ImagesToPdf = lazy(() => import("@/pages/pdf-tools/ImagesToPdf"));
const AddPagesPdf = lazy(() => import("@/pages/pdf-tools/AddPagesPdf"));
const PdfEditor = lazy(() => import("@/pages/pdf-tools/PdfEditor"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackTitle="This tool ran into a problem"
      fallbackMessage="Something went wrong while loading this tool. Your files have not been changed."
    >
      {children}
    </ErrorBoundary>
  );
}

export const routes = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <RouteErrorBoundary>
            <Home />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "compress",
        element: (
          <RouteErrorBoundary>
            <CompressIndex />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "compress/pdf",
        element: (
          <RouteErrorBoundary>
            <CompressPdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "compress/image",
        element: (
          <RouteErrorBoundary>
            <CompressImage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "resize",
        element: (
          <RouteErrorBoundary>
            <ResizeIndex />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "resize/image",
        element: (
          <RouteErrorBoundary>
            <ResizeImage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "convert",
        element: (
          <RouteErrorBoundary>
            <ConvertIndex />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "convert/image",
        element: (
          <RouteErrorBoundary>
            <ConvertImage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "convert/pdf",
        element: (
          <RouteErrorBoundary>
            <CompressIndex />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools",
        element: (
          <RouteErrorBoundary>
            <PdfToolsIndex />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/merge",
        element: (
          <RouteErrorBoundary>
            <MergePdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/split",
        element: (
          <RouteErrorBoundary>
            <SplitPdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/rotate",
        element: (
          <RouteErrorBoundary>
            <RotatePdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/reorder",
        element: (
          <RouteErrorBoundary>
            <ReorderPdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/delete-pages",
        element: (
          <RouteErrorBoundary>
            <DeletePagesPdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/extract-pages",
        element: (
          <RouteErrorBoundary>
            <ExtractPagesPdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/images-to-pdf",
        element: (
          <RouteErrorBoundary>
            <ImagesToPdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/add-pages",
        element: (
          <RouteErrorBoundary>
            <AddPagesPdf />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "pdf-tools/editor",
        element: (
          <RouteErrorBoundary>
            <PdfEditor />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "privacy",
        element: (
          <RouteErrorBoundary>
            <Privacy />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "*",
        element: (
          <RouteErrorBoundary>
            <NotFound />
          </RouteErrorBoundary>
        ),
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}