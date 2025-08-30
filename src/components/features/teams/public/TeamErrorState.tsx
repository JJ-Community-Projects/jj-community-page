import {type Component} from "solid-js";
import {FaSolidTriangleExclamation, FaSolidArrowLeft} from "solid-icons/fa";

interface TeamErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export const TeamErrorState: Component<TeamErrorStateProps> = (props) => {
  const {error, onRetry} = props;

  return (
    <div class="w-full mx-4 xl:mx-20 py-8 md:py-12 lg:py-16">
      <div class="bg-white rounded-xl shadow-md border-2 border-danger-200 p-8 md:p-12 lg:p-16">
        <div class="flex flex-col items-center justify-center text-center">
          {/* Error Icon */}
          <div class="w-20 h-20 bg-gradient-to-br from-danger-500 to-danger-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <FaSolidTriangleExclamation class="w-10 h-10 text-white" />
          </div>

          {/* Error Title */}
          <h1 class="~text-2xl/3xl font-babas mb-4 text-neutral-800">
            Team Not Found
          </h1>

          {/* Error Message */}
          <p class="~text-base/lg font-poppins text-neutral-600 mb-8 max-w-md">
            {error || "The team you're looking for doesn't exist or may have been removed."}
          </p>

          {/* Action Buttons */}
          <div class="flex flex-col sm:flex-row gap-4">
            <a
              href="/teams"
              class="px-6 py-3 bg-accent text-white rounded-lg font-medium font-poppins hover:bg-accent-600 shadow-sm hover:shadow-md focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-200 transform active:scale-95 flex items-center gap-2"
            >
              <FaSolidArrowLeft class="w-4 h-4" />
              Back to Teams
            </a>

            {onRetry && (
              <button
                onClick={onRetry}
                class="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-lg font-medium font-poppins hover:bg-neutral-300 shadow-sm hover:shadow-md focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-all duration-200 transform active:scale-95"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TeamNotFoundState: Component = () => {
  return (
    <TeamErrorState
      error="This team doesn't exist or may have been made private."
    />
  );
};
