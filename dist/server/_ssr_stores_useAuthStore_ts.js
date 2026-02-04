"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_ssr_stores_useAuthStore_ts";
exports.ids = ["_ssr_stores_useAuthStore_ts"];
exports.modules = {

/***/ "(ssr)/./stores/useAuthStore.ts":
/*!********************************!*\
  !*** ./stores/useAuthStore.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   useAuthStore: () => (/* binding */ useAuthStore)\n/* harmony export */ });\n/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! zustand */ \"(ssr)/./node_modules/zustand/esm/react.mjs\");\n\nconst useAuthStore = (0,zustand__WEBPACK_IMPORTED_MODULE_0__.create)((set)=>({\n        userDetail: undefined,\n        accessToken: null,\n        refreshToken: null,\n        setAccessToken: (accessToken)=>set({\n                accessToken\n            }),\n        setRefreshToken: (refreshToken)=>set({\n                refreshToken\n            }),\n        setAccessAndRefreshToken: (data)=>set({\n                accessToken: data.accessToken,\n                refreshToken: data.refreshToken\n            }),\n        setUserDetail: (userDetail)=>set({\n                userDetail\n            })\n    }));\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9zdG9yZXMvdXNlQXV0aFN0b3JlLnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBRWdDO0FBWXpCLE1BQU1DLGVBQWVELCtDQUFNQSxDQUFZLENBQUNFLE1BQVM7UUFDdERDLFlBQVlDO1FBQ1pDLGFBQWE7UUFDYkMsY0FBYztRQUNkQyxnQkFBZ0IsQ0FBQ0YsY0FBZ0JILElBQUk7Z0JBQUVHO1lBQVk7UUFDbkRHLGlCQUFpQixDQUFDRixlQUFpQkosSUFBSTtnQkFBRUk7WUFBYTtRQUN0REcsMEJBQTBCLENBQUNDLE9BQ3pCUixJQUFJO2dCQUFFRyxhQUFhSyxLQUFLTCxXQUFXO2dCQUFFQyxjQUFjSSxLQUFLSixZQUFZO1lBQUM7UUFDdkVLLGVBQWUsQ0FBQ1IsYUFBMEJELElBQUk7Z0JBQUVDO1lBQVc7SUFDN0QsSUFBRyIsInNvdXJjZXMiOlsiSDpcXGR1YW5fdG90bmdoaWVwXFxhZ3Jpc2hyaW1wLWZlLXJlYWN0XFxzdG9yZXNcXHVzZUF1dGhTdG9yZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBdXRoUmVzcG9uc2UgfSBmcm9tICdAL2FwcC90eXBlcy9hdXRoLnNjaGVtYSdcclxuaW1wb3J0IHsgVXNlclR5cGUgfSBmcm9tICdAL2FwcC90eXBlcy91c2VyLnNjaGVtYSdcclxuaW1wb3J0IHsgY3JlYXRlIH0gZnJvbSAnenVzdGFuZCdcclxuXHJcbmludGVyZmFjZSBBdXRoU3RvcmUge1xyXG4gIHVzZXJEZXRhaWw/OiBVc2VyVHlwZVxyXG4gIGFjY2Vzc1Rva2VuOiBzdHJpbmcgfCBudWxsXHJcbiAgcmVmcmVzaFRva2VuPzogc3RyaW5nIHwgbnVsbFxyXG4gIHNldEFjY2Vzc1Rva2VuOiAodG9rZW46IHN0cmluZyB8IG51bGwpID0+IHZvaWRcclxuICBzZXRSZWZyZXNoVG9rZW46ICh0b2tlbjogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZFxyXG4gIHNldEFjY2Vzc0FuZFJlZnJlc2hUb2tlbjogKGRhdGE6IEF1dGhSZXNwb25zZSkgPT4gdm9pZFxyXG4gIHNldFVzZXJEZXRhaWw6ICh1c2VyRGV0YWlscz86IFVzZXJUeXBlKSA9PiB2b2lkXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCB1c2VBdXRoU3RvcmUgPSBjcmVhdGU8QXV0aFN0b3JlPigoc2V0KSA9PiAoe1xyXG4gIHVzZXJEZXRhaWw6IHVuZGVmaW5lZCxcclxuICBhY2Nlc3NUb2tlbjogbnVsbCxcclxuICByZWZyZXNoVG9rZW46IG51bGwsXHJcbiAgc2V0QWNjZXNzVG9rZW46IChhY2Nlc3NUb2tlbikgPT4gc2V0KHsgYWNjZXNzVG9rZW4gfSksXHJcbiAgc2V0UmVmcmVzaFRva2VuOiAocmVmcmVzaFRva2VuKSA9PiBzZXQoeyByZWZyZXNoVG9rZW4gfSksXHJcbiAgc2V0QWNjZXNzQW5kUmVmcmVzaFRva2VuOiAoZGF0YTogQXV0aFJlc3BvbnNlKSA9PlxyXG4gICAgc2V0KHsgYWNjZXNzVG9rZW46IGRhdGEuYWNjZXNzVG9rZW4sIHJlZnJlc2hUb2tlbjogZGF0YS5yZWZyZXNoVG9rZW4gfSksXHJcbiAgc2V0VXNlckRldGFpbDogKHVzZXJEZXRhaWw/OiBVc2VyVHlwZSkgPT4gc2V0KHsgdXNlckRldGFpbCB9KVxyXG59KSlcclxuIl0sIm5hbWVzIjpbImNyZWF0ZSIsInVzZUF1dGhTdG9yZSIsInNldCIsInVzZXJEZXRhaWwiLCJ1bmRlZmluZWQiLCJhY2Nlc3NUb2tlbiIsInJlZnJlc2hUb2tlbiIsInNldEFjY2Vzc1Rva2VuIiwic2V0UmVmcmVzaFRva2VuIiwic2V0QWNjZXNzQW5kUmVmcmVzaFRva2VuIiwiZGF0YSIsInNldFVzZXJEZXRhaWwiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./stores/useAuthStore.ts\n");

/***/ })

};
;