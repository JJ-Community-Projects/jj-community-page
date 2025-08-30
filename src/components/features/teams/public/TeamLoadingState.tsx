import {type Component} from "solid-js";
import {FaSolidUsers} from "solid-icons/fa";

export const TeamLoadingState: Component = () => {
  return (
    <div class="w-full mx-4 xl:mx-20 py-8 md:py-12 lg:py-16">
      {/* Team Header Skeleton */}
      <div class="bg-white rounded-xl shadow-md border-2 border-primary-200 mb-6">
        <div class="p-4 md:p-6 lg:p-8">
          <div class="flex flex-col items-center text-center">
            {/* Loading Team Icon */}
            <div class="relative mb-4">
              <div class="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                <FaSolidUsers class="w-8 h-8 text-white" />
              </div>
              <div class="absolute inset-0 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            {/* Loading Team Name */}
            <div class="h-8 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 rounded-lg mb-2 animate-pulse w-48"></div>

            {/* Loading Description */}
            <div class="h-5 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 rounded-lg mb-4 animate-pulse w-72"></div>

            {/* Loading Member Count */}
            <div class="h-8 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 rounded-full animate-pulse w-24"></div>
          </div>
        </div>
      </div>

      {/* Team Members Section Skeleton */}
      <div class="bg-white rounded-xl shadow-md border-2 border-primary-200 mb-6">
        <div class="p-4 md:p-6 lg:p-8">
          {/* Section Header */}
          <div class="flex flex-col items-center text-center mb-6">
            <div class="flex items-center gap-3 mb-2">
              <FaSolidUsers class="w-5 h-5 text-primary animate-pulse" />
              <div class="h-6 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 rounded-lg animate-pulse w-32"></div>
            </div>
          </div>

          {/* Loading Member Grid */}
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} class="transform transition-all duration-200">
                <div class="bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl shadow-md p-3 animate-pulse">
                  <div class="flex flex-col items-center text-center">
                    <div class="w-12 h-12 bg-white/30 rounded-full mb-2"></div>
                    <div class="h-4 bg-white/30 rounded-full w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Streams Section Skeleton */}
      <div class="bg-white rounded-xl shadow-md border-2 border-primary-200 mb-6">
        <div class="p-4 md:p-6 lg:p-8">
          {/* Section Header */}
          <div class="flex flex-col items-center text-center mb-6">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-5 h-5 bg-primary rounded animate-pulse"></div>
              <div class="h-6 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 rounded-lg animate-pulse w-48"></div>
            </div>
          </div>

          {/* Loading Streams Grid */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} class="bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl p-4 animate-pulse">
                <div class="h-4 bg-neutral-300 rounded mb-2 w-3/4"></div>
                <div class="h-3 bg-neutral-300 rounded mb-2 w-1/2"></div>
                <div class="h-3 bg-neutral-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Status */}
      <div class="text-center">
        <div class="bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 px-4 py-2 rounded-full inline-block font-poppins">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Loading team information...
          </div>
        </div>
      </div>
    </div>
  );
};
