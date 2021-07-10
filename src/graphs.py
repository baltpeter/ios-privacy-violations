import json
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

show = True

# for type in ['occurrences', 'apps']:
#     with open(f'../data/indicator_{type}.json') as f:
#         indicators = json.load(f)
#         plt.title('indicators found in requests (as plain text or base64-encoded)')
#         plt.ylabel(f'#{type}')
#         plt.xlabel('indicators')
#         plt.xticks(rotation=90)
#         plt.bar(*zip(*(dict(sorted(indicators.items(),
#                 key=lambda x: x[1], reverse=True))).items()))
#         plt.tight_layout()
#         plt.savefig(f'../graphs/indicator_{type}.svg')
#         if show:
#             plt.show()

# with open('../data/requests_per_app.json') as f:
#     requests_per_app = json.load(f)
#     plt.title("#requests per app")
#     plt.ylabel('#apps')
#     plt.xlabel('#requests')
#     plt.hist(requests_per_app.values())
#     plt.tight_layout()
#     plt.savefig("../graphs/requests_per_app.svg")
#     if show:
#         plt.show()

# with open('../data/hosts_per_app.json') as f:
#     hosts_per_app = json.load(f)
#     plt.title("#hosts per app")
#     plt.ylabel('#apps')
#     plt.xlabel('#hosts')
#     plt.hist(hosts_per_app.values())
#     plt.tight_layout()
#     plt.savefig("../graphs/hosts_per_app.svg")
#     if show:
#         plt.show()

# with open('../data/tracker_counts.json') as f:
#     tracker_counts = json.load(f)
#     plt.title("#apps contacting third-party servers")
#     plt.xlabel("third-party companies")
#     plt.xticks(rotation=90)
#     plt.ylabel("#apps")
#     plt.bar(*zip(*sorted(filter(lambda x: x[1] > 15, tracker_counts.items()),
#             key=lambda x: x[1], reverse=True)))
#     plt.tight_layout()
#     plt.savefig("../graphs/tracker_counts.svg")
#     plt.show()

with open('../data/filter_stats.json') as f:
    data = json.load(f)
    for type in ['blocked_requests', 'blocked_ratio']:
        fig, ax = plt.subplots()
        plt.title(
            f"{'Ratio of requests' if type == 'blocked_ratio' else '#requests'} blocked by tracking filter list per app")
        plt.ylabel('#apps')
        plt.xlabel('ratio of blocked requests' if type ==
                   'blocked_ratio' else '#requests blocked')
        if type == 'blocked_ratio':
            ax.xaxis.set_major_formatter(mtick.PercentFormatter(1.0))
        plt.hist([x[type] for x in data])
        plt.tight_layout()
        plt.savefig(f"../graphs/filter_{type}.svg")
        if show:
            plt.show()
