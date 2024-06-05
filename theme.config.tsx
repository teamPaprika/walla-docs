import React from "react";
import Link from "next/link";
import {DocsThemeConfig} from "nextra-theme-docs";

const config: DocsThemeConfig = {
    useNextSeoProps() {
        return {titleTemplate: '%s - Walla Docs'}
    },
    logo: <Link legacyBehavior href="/">
        <svg width="520" height="24" viewBox="0 0 2000 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_1908_765)">
                <path fillRule="evenodd" clipRule="evenodd"
                      d="M255.339 77.7018C252.319 74.6126 249.958 70.8917 248.344 66.8165C242.208 66.7279 236.7 64.6941 231.161 60.5842C237.49 51.5632 243.464 38.5246 243.133 28.2363C243.772 11.658 227.783 -2.409 212.245 5.52582C194.195 14.9166 198.89 43.4473 209.695 58.0612C213.269 55.0722 217.036 51.3629 219.151 47.1643C197.384 5.06359 248.637 9.84759 221.243 50.3999C218.658 54.0746 215.299 58.2423 212.168 61.4624C208.166 65.3952 203.728 68.8233 198.921 71.6313C194.11 68.8233 189.63 65.3874 185.663 61.447C198.209 46.7791 204.907 15.9682 185.59 5.52967C178.502 1.78567 168.807 2.99515 162.968 8.29915C149.113 21.068 154.987 43.0968 164.721 57.6914C168.869 55.3534 172.305 51.6325 174.839 47.6343C155.884 16.9812 184.415 8.02952 184.157 29.2917C183.849 41.3211 176.311 53.308 166.631 60.6034V60.5957C160.641 65.06 154.251 67.1901 147.507 66.7895V81.2263C157.51 81.7039 167.197 78.1525 175.714 71.431C181.588 77.3629 195.566 86.2606 198.925 86.2606C202.284 86.2606 216.936 76.0571 222.132 71.431C222.132 71.431 235.352 84.77 258.444 80.4636C257.358 79.62 256.321 78.7033 255.343 77.7018H255.339Z"
                      fill="#2670FF"/>
                <path
                    d="M128.717 32.1575C123.621 26.4414 117.247 24.3537 109.92 24.3537C94.0892 24.3074 82.9651 37.7273 83.3194 53.3042C82.9612 68.8772 94.0931 82.3048 109.92 82.2547C117.574 82.2547 123.968 79.9975 128.717 74.4509V81.207H143.404V25.6017H128.717V32.1614V32.1575ZM123.718 64.4938C118.317 70.364 107.471 70.391 102.097 64.4938C98.9811 61.3892 97.5713 56.6669 97.9064 52.0446C98.2877 43.8749 104.655 37.5732 112.871 37.7042C121.584 37.5809 128.159 44.5143 127.993 53.3042C127.974 57.8686 126.564 61.5857 123.718 64.4938Z"
                    fill="#2670FF"/>
                <path
                    d="M296.292 31.9534C291.146 26.1833 284.71 24.0725 277.314 24.0725C261.329 24.0263 250.097 37.5771 250.455 53.3042C250.093 69.0274 261.333 82.586 277.314 82.5359C285.041 82.5359 291.5 80.2594 296.292 74.655V81.4766H311.122V25.332H296.292V31.9534ZM291.242 64.6017C285.792 70.5297 274.837 70.5566 269.414 64.6017C266.267 61.4663 264.846 56.6977 265.181 52.0331C265.566 43.7863 271.995 37.423 280.291 37.554C289.089 37.4307 295.726 44.4295 295.56 53.308C295.541 57.9187 294.116 61.6704 291.246 64.6055L291.242 64.6017Z"
                    fill="#2670FF"/>
                <path
                    d="M70.4465 25.6017L59.7153 60.3415L48.8684 25.6017H36.6196L25.7727 60.3415L15.0415 25.6017H0L17.1754 81.207H31.8625L42.744 46.3516L53.6255 81.207H68.3126L85.488 25.6017H70.4465Z"
                    fill="#2670FF"/>
            </g>
            <path
                d="M509.677 51.3678C509.366 49.7051 508.563 48.4191 507.267 47.5098C505.972 46.6005 504.287 46.1458 502.214 46.1458C500.815 46.1458 499.558 46.3537 498.444 46.7693C497.33 47.185 496.449 47.7825 495.801 48.5619C495.179 49.3413 494.868 50.2117 494.868 51.1729C494.842 52.2901 495.321 53.2513 496.306 54.0567C497.291 54.8621 498.82 55.4986 500.893 55.9662L508.084 57.525C512.074 58.3564 515.041 59.7203 516.985 61.6169C518.954 63.5134 519.939 65.9685 519.939 68.9822C519.939 71.6061 519.2 73.9443 517.723 75.9968C516.246 78.0232 514.16 79.608 511.465 80.7511C508.77 81.8942 505.596 82.4658 501.942 82.4658C498.392 82.4658 495.321 81.9592 492.73 80.9459C490.139 79.9327 488.092 78.4649 486.589 76.5423C485.086 74.5938 484.153 72.2816 483.79 69.6057H493.857C494.22 71.3723 495.075 72.7103 496.423 73.6196C497.77 74.5029 499.597 74.9446 501.903 74.9446C503.484 74.9446 504.87 74.7497 506.062 74.36C507.254 73.9443 508.174 73.3598 508.822 72.6064C509.47 71.827 509.794 70.9177 509.794 69.8785C509.794 68.6314 509.302 67.6052 508.317 66.7999C507.332 65.9945 505.79 65.371 503.691 64.9293L496.889 63.5264C492.976 62.695 490.009 61.2791 487.988 59.2787C485.993 57.2522 484.995 54.7452 484.995 51.7575C484.995 49.1595 485.695 46.8862 487.094 44.9377C488.519 42.9633 490.515 41.4434 493.08 40.3783C495.671 39.3131 498.677 38.7805 502.098 38.7805C505.389 38.7805 508.265 39.3001 510.727 40.3393C513.214 41.3525 515.171 42.8074 516.596 44.7039C518.021 46.6005 518.838 48.8217 519.045 51.3678H509.677Z"
                fill="#2670FF"/>
            <path
                d="M460.274 82.4658C456.154 82.4658 452.552 81.5435 449.468 79.6989C446.411 77.8543 444.065 75.2823 442.433 71.9829C440.826 68.6834 440.023 64.9033 440.023 60.6426C440.023 56.3559 440.852 52.5629 442.511 49.2634C444.169 45.938 446.514 43.366 449.546 41.5474C452.578 39.7028 456.128 38.7805 460.196 38.7805C463.591 38.7805 466.623 39.404 469.292 40.6511C471.961 41.8721 474.073 43.6387 475.628 45.951C477.208 48.2372 478.102 50.9001 478.31 53.9398H468.864C468.605 52.5369 468.1 51.3028 467.348 50.2377C466.597 49.1465 465.638 48.2892 464.472 47.6656C463.306 47.0421 461.932 46.7304 460.352 46.7304C458.305 46.7304 456.504 47.2889 454.949 48.4061C453.394 49.4972 452.176 51.069 451.295 53.1214C450.44 55.1738 450.012 57.616 450.012 60.4478C450.012 63.3056 450.44 65.7866 451.295 67.891C452.15 69.9694 453.355 71.5672 454.91 72.6843C456.465 73.8015 458.279 74.36 460.352 74.36C461.829 74.36 463.15 74.0872 464.316 73.5417C465.508 72.9701 466.493 72.1517 467.271 71.0866C468.048 69.9954 468.579 68.7094 468.864 67.2285H478.31C478.076 70.2162 477.195 72.8532 475.666 75.1394C474.138 77.4257 472.052 79.2183 469.408 80.5173C466.791 81.8163 463.746 82.4658 460.274 82.4658Z"
                fill="#2670FF"/>
            <path
                d="M413.941 82.4658C409.899 82.4658 406.336 81.5565 403.252 79.7379C400.195 77.9193 397.837 75.3603 396.178 72.0608C394.52 68.7613 393.69 64.9553 393.69 60.6426C393.69 56.278 394.52 52.4589 396.178 49.1855C397.837 45.886 400.195 43.327 403.252 41.5084C406.336 39.6898 409.899 38.7805 413.941 38.7805C418.01 38.7805 421.573 39.6898 424.631 41.5084C427.688 43.327 430.033 45.886 431.666 49.1855C433.299 52.4589 434.115 56.278 434.115 60.6426C434.115 64.9553 433.299 68.7613 431.666 72.0608C430.033 75.3603 427.688 77.9193 424.631 79.7379C421.573 81.5565 418.01 82.4658 413.941 82.4658ZM414.019 74.5549C416.196 74.5549 418.036 73.9443 419.539 72.7233C421.068 71.4763 422.208 69.8005 422.959 67.6962C423.711 65.5918 424.086 63.2276 424.086 60.6036C424.086 57.9537 423.711 55.5765 422.959 53.4722C422.208 51.3678 421.068 49.7051 419.539 48.484C418.036 47.237 416.196 46.6134 414.019 46.6134C411.791 46.6134 409.899 47.237 408.344 48.484C406.789 49.7051 405.623 51.3678 404.846 53.4722C404.069 55.5765 403.68 57.9537 403.68 60.6036C403.68 63.2536 404.069 65.6308 404.846 67.7351C405.623 69.8135 406.789 71.4763 408.344 72.7233C409.899 73.9443 411.791 74.5549 414.019 74.5549Z"
                fill="#2670FF"/>
            <path
                d="M345.337 81.6474V72.8402H359.096C363.061 72.8402 366.339 72.1128 368.93 70.6579C371.548 69.203 373.517 67.0467 374.839 64.1889C376.16 61.3051 376.821 57.7069 376.821 53.3942C376.821 49.0815 376.173 45.4963 374.878 42.6385C373.582 39.7547 371.638 37.5984 369.047 36.1695C366.482 34.7406 363.268 34.0262 359.407 34.0262H345.026V25.219H359.952C365.523 25.219 370.33 26.3491 374.372 28.6094C378.415 30.8436 381.511 34.0781 383.662 38.3129C385.813 42.5476 386.888 47.5747 386.888 53.3942C386.888 59.2397 385.8 64.2798 383.623 68.5145C381.472 72.7493 378.35 75.9968 374.256 78.257C370.161 80.5173 365.277 81.6474 359.602 81.6474H345.337ZM350.662 81.6474H340.556V25.219H350.662V81.6474Z"
                fill="#2670FF"/>
            <defs>
                <clipPath id="clip0_1908_765">
                    <rect width="311.122" height="83.0113" fill="white" transform="translate(0 3.24937)"/>
                </clipPath>
            </defs>
        </svg>
    </Link>,
    footer: {
        component: () => null,
    },
    feedback: {
        content: () => null,
    },
    editLink: {
        component: () => null,
    },
    i18n: [
        {locale: "ko", text: "한국어"},
        {locale: "en", text: "English"},
    ],
    search: {
        placeholder: "🔍",
    },
    darkMode: false,
};

export default config;
