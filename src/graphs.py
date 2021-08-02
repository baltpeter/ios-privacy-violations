import json
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

show = True
color = (0.737, 0.114, 0.231, 1)

for type in ['occurrences', 'apps']:
    with open(f'../data/indicator_{type}.json') as f:
        indicators = json.load(f)
        plt.title('indicators found in requests (as plain text or base64-encoded)')
        plt.ylabel(f'#{type}')
        plt.xlabel('indicators')
        plt.xticks(rotation=90)
        plt.bar(*zip(*(dict(sorted(indicators.items(),
                key=lambda x: x[1], reverse=True))).items()), color=color)
        plt.tight_layout()
        plt.savefig(f'../graphs/indicator_{type}.svg')
        if show:
            plt.show()


with open('../data/requests_per_app.json') as f:
    requests_per_app = json.load(f)
    plt.title("#requests per app")
    plt.ylabel('#apps')
    plt.xlabel('#requests')
    plt.hist(requests_per_app.values(), color=color, bins='auto')
    plt.tight_layout()
    plt.savefig("../graphs/requests_per_app.svg")
    if show:
        plt.show()

with open('../data/hosts_per_app.json') as f:
    hosts_per_app = json.load(f)
    plt.title("#hosts per app")
    plt.ylabel('#apps')
    plt.xlabel('#hosts')
    plt.hist(hosts_per_app.values(), color=color, bins='auto')
    plt.tight_layout()
    plt.savefig("../graphs/hosts_per_app.svg")
    if show:
        plt.show()

with open('../data/tracker_counts.json') as f:
    tracker_counts = json.load(f)
    plt.title("#apps contacting third-party servers")
    plt.xlabel("third-party companies")
    plt.xticks(rotation=90)
    plt.ylabel("#apps")
    plt.bar(*zip(*sorted(filter(lambda x: x[1] > 15, tracker_counts.items()),
            key=lambda x: x[1], reverse=True)), color=color)
    plt.tight_layout()
    plt.savefig("../graphs/tracker_counts.svg")
    if show:
        plt.show()

with open('../data/filter_stats.json') as f:
    data = json.load(f)
    for type in ['blocked_requests', 'blocked_ratio']:
        fig, ax = plt.subplots()
        plt.title(
            f"{'ratio of requests' if type == 'blocked_ratio' else '#requests'} blocked by tracking filter list per app")
        plt.ylabel('#apps')
        plt.xlabel('ratio of blocked requests' if type ==
                   'blocked_ratio' else '#requests blocked')
        if type == 'blocked_ratio':
            ax.xaxis.set_major_formatter(mtick.PercentFormatter(1.0))
        plt.hist([x[type] for x in data], color=color, bins='auto')
        plt.tight_layout()
        plt.savefig(f"../graphs/filter_{type}.svg")
        if show:
            plt.show()

with open(f'../data/privacy_label_categories_for_graph.json') as f:
    indicators = json.load(f)
    ok_data = list(zip(*(dict(sorted(indicators['ok'].items(),
                                     key=lambda x: x[1], reverse=True))).items()))
    nok_data = list(zip(*(dict(sorted(indicators['nok'].items(),
                                      key=lambda x: indicators['ok'][x[0]], reverse=True))).items()))
    plt.title(
        'privacy label indicators in requests (as plain text or base64-encoded)')
    plt.ylabel('#apps')
    plt.xlabel('indicators')
    plt.xticks(rotation=90)
    plt.bar(*ok_data, color=(0.678, 0.749, 0.302, 1), label='declared')
    plt.bar(*nok_data, color=color,
            label='not declared', bottom=ok_data[1])
    plt.tight_layout()
    plt.legend()
    plt.savefig(f'../graphs/privacy_label_indicator.svg')
    if show:
        plt.show()

with open(f'../data/privacy_label_purposes_for_graph.json') as f:
    indicators = json.load(f)
    ok_data = indicators['ok']
    nok_data = indicators['nok']
    plt.title(
        'privacy label purposes in requests')
    plt.ylabel('#apps')
    plt.xlabel('purposes')
    plt.xticks(rotation=90)
    plt.bar(*ok_data, color=(0.678, 0.749, 0.302, 1),
            label='declared', width=0.5)
    plt.bar(*nok_data, color=color,
            label='not declared', bottom=ok_data[1], width=0.5)
    plt.tight_layout()
    plt.legend()
    plt.savefig(f'../graphs/privacy_label_purposes.svg')
    if show:
        plt.show()
